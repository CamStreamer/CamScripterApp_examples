import * as fs from 'fs';
import * as path from 'path';

import { httpRequest, HttpRequestOptions } from 'camstreamerlib/HttpRequest';
import { CamOverlayAPI, CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';
import {
    CamScripterAPICameraEventsGenerator,
    CamScripterOptions,
    Response as CegResponse,
} from 'camstreamerlib/CamScripterAPICameraEventsGenerator';

type Camera = {
    protocol: string;
    ip: string;
    port: number;
    user: string;
    password: string;
};

type Settings = {
    co_camera: Camera;
    events_camera: Camera;
    events: {
        temperature_delay: number;
        temperature_operator: string;
        temperature_value: number;
        door_delay: number;
        battery_charge_percentage: number;
    };
};

type Response = {
    temperature: number;
    batteryChargePercentage: number;
    outputVoltage_1: number;
    outputVoltage_2: number;
    load: number;
    current: number;
    doorOpened: boolean;
    battBreak: string;
    gridConnection: string;
};

enum Alarm {
    temperature = 'temperature',
    doors = 'doors_open',
    batteryPercentage = 'battery_percentage',
    powerLineDisconnection = 'power_line_disconnection',
}

const nameOfThisPackage = 'imco_power_monitor';

// -------------
// |   setup   |
// -------------

let settings: Settings;
let co: CamOverlayAPI;
let ceg: CamScripterAPICameraEventsGenerator;
let alarmSetup: Record<Alarm, boolean>;

function readSettings(): void {
    try {
        const data = fs.readFileSync(path.join(process.env.PERSISTENT_DATA_PATH, 'settings.json'));
        settings = JSON.parse(data.toString());
    } catch (error) {
        console.log('Cannot read Settings file: ', error.message);
        process.exit(1);
    }
}
function coSetup(): void {
    const co_camera = settings.co_camera;
    if (
        co_camera.protocol.length == 0 ||
        co_camera.port == 0 ||
        co_camera.ip.length == 0 ||
        co_camera.user.length == 0 ||
        co_camera.password.length == 0
    ) {
        co = null;
    }
    const options: CamOverlayOptions = {
        ip: co_camera.ip,
        port: co_camera.port,
        auth: `${co_camera.user}:${co_camera.password}`,
        tls: co_camera.protocol != 'http',
        tlsInsecure: co_camera.ip == 'https_insecure',
    };
    co = new CamOverlayAPI(options);
}
async function declareEvents() {
    return ceg.declareEvent({
        declaration_id: nameOfThisPackage,
        stateless: false,
        declaration: [
            {
                namespace: 'tnsaxis',
                key: 'topic0',
                value: 'CameraApplicationPlatform',
                value_type: 'STRING',
            },
            {
                namespace: 'tnsaxis',
                key: 'topic1',
                value: 'CamScripter',
                value_type: 'STRING',
            },
            {
                namespace: 'tnsaxis',
                key: 'topic2',
                value: nameOfThisPackage,
                value_type: 'STRING',
                value_nice_name: `CamScripter: ${nameOfThisPackage}`,
            },
            {
                type: 'DATA',
                namespace: '',
                key: 'alarm',
                value: '',
                value_type: 'STRING',
            },
        ],
    });
}
async function cegSetup(): Promise<void> {
    const events_camera = settings.events_camera;
    if (
        events_camera.protocol.length == 0 ||
        events_camera.port == 0 ||
        events_camera.ip.length == 0 ||
        events_camera.user.length == 0 ||
        events_camera.password.length == 0
    ) {
        ceg = null;
        return;
    }
    const options: CamScripterOptions = {
        ip: events_camera.ip,
        port: events_camera.port,
        auth: `${events_camera.user}:${events_camera.password}`,
        tls: events_camera.protocol != 'http',
        tlsInsecure: events_camera.ip == 'https_insecure',
    };
    ceg = new CamScripterAPICameraEventsGenerator(options);
    await ceg.connect();
    await declareEvents();

    const events = settings.events;
    alarmSetup = {
        temperature:
            events.temperature_delay != null &&
            events.temperature_operator.length != 0 &&
            events.temperature_value != null,
        doors_open: events.door_delay != null,
        battery_percentage: events.battery_charge_percentage != null,
        power_line_disconnection: true,
    };
}

// -------------
// |   alarm   |
// -------------

function triggerAlarm(alarm: Alarm): Promise<CegResponse> {
    return ceg.sendEvent({
        declaration_id: nameOfThisPackage,
        event_data: [
            {
                namespace: '',
                key: 'alarm',
                value: alarm,
                value_type: 'STRING',
            },
        ],
    });
}

function checkTemperatureCondition(actualTemperature: number, triggerTemperature: number, operator: string): boolean {
    switch (operator) {
        case '=':
            return actualTemperature == triggerTemperature;
        case '<':
            return actualTemperature < triggerTemperature;
        case '>':
            return actualTemperature > triggerTemperature;
        case '<=':
            return actualTemperature <= triggerTemperature;
        case '>=':
            return actualTemperature >= triggerTemperature;
        default:
            throw new Error('Unexpected operator.');
    }
}

let temperatureTimeoutID: NodeJS.Timeout = null;
let doorTimeoutID: NodeJS.Timeout = null;
function checkConditions(response: Response): void {
    const events = settings.events;
    if (alarmSetup[Alarm.temperature]) {
        if (checkTemperatureCondition(response.temperature, events.temperature_value, events.temperature_operator)) {
            if (doorTimeoutID == null) {
                temperatureTimeoutID = setTimeout(triggerAlarm, 1000 * events.temperature_delay, Alarm.temperature);
            }
        } else {
            clearTimeout(temperatureTimeoutID);
        }
    }
    if (alarmSetup[Alarm.doors]) {
        console.log(response.doorOpened);
        if (response.doorOpened) {
            if (doorTimeoutID == null) {
                doorTimeoutID = setTimeout(triggerAlarm, 1000 * events.door_delay, Alarm.doors);
            }
        } else {
            clearTimeout(doorTimeoutID);
            doorTimeoutID = null;
        }
    }
    if (alarmSetup[Alarm.batteryPercentage] && response.batteryChargePercentage < events.battery_charge_percentage) {
        triggerAlarm(Alarm.batteryPercentage);
    }
    if (alarmSetup[Alarm.powerLineDisconnection] && response.gridConnection != 'ok') {
        triggerAlarm(Alarm.powerLineDisconnection);
    }
}

// --------------------
// |   power source   |
// --------------------

const refreshPeriod = 1000;

function parseResponse(response: string): Response {
    const answer: any = {};
    const a = response.split('|');
    for (let i = 0; i < a.length; i += 2) {
        answer[a[i]] = a[i + 1];
    }

    const ov = answer.U03 == 0 || answer.U90 == 0 ? (answer.U14 == 1 || answer.U14 == 2 ? 'yell' : 'ok') : 'error';
    const battBreak = answer.U08 == 0 ? (answer.T20[3] == 0 ? 'close' : 'open') : 'none';
    const doorOpened = answer.T20[4] != 0;
    const u1OutV = answer.T20[4] == 1 && answer.U09 == 0 ? 0 : answer.F01;

    return {
        temperature: Number.parseFloat(answer.F04),
        batteryChargePercentage: Number.parseFloat(answer.F05),
        outputVoltage_1: Number.parseFloat(u1OutV),
        outputVoltage_2: Number.parseFloat(answer.F02),
        load: Number.parseFloat(answer.F15),
        current: Number.parseFloat(answer.F03),
        doorOpened: doorOpened,
        battBreak: battBreak,
        gridConnection: ov,
    };
}

async function connectToPowerSource(): Promise<void> {
    const options: HttpRequestOptions = {
        method: 'GET',
        protocol: 'http:',
        host: '192.168.90.176',
        port: 80,
        path: '/shared.txt',
    };
    const response = parseResponse((await httpRequest(options)) as string);

    checkConditions(response);

    setTimeout(connectToPowerSource, refreshPeriod);
}

// -------------------
// |   entry point   |
// -------------------

async function main(): Promise<void> {
    process.on('uncaughtException', (error) => {
        console.log(error.message);
        console.log(error.stack);
        process.exit(1);
    });

    readSettings();
    coSetup();
    await cegSetup();

    if (co == null && ceg == null) {
        console.log('Application is not configured');
        process.exit(1);
    }

    connectToPowerSource();
}

main();
