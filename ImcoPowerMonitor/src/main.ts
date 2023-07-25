import * as fs from 'fs';
import * as path from 'path';

import { httpRequest, HttpRequestOptions } from 'camstreamerlib/HttpRequest';
import { CamOverlayAPI, CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';
import {
    CamScripterAPICameraEventsGenerator,
    CamScripterOptions,
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
        battery_percentage: number;
    };
};

const temperatureAlarm = "temperature";
const doorsAlarm = "doors_open";
const batteryPercentageAlarm = "battery_percentage";
const powerLineDisconnectionAlarm = "power_line_disconnection"

function triggerAlarm(alarm: string)
{
    return ceg.sendEvent({
        declaration_id: nameOfThisPackage,
        event_data: [
            {
                namespace: "",
                key: 'alarm',
                value: alarm,
                value_type: 'STRING',
            }
        ]
    })
}


function parseResponse(response: string)
{
    const answer: any = {};
    const a = response.split("|");
    for(let i=0; i<a.length; i+=2) 
    { 
        answer[a[i]] = a[i+1];
    }

    const ov = (answer.U03==0 || answer.U90==0) ? ((answer.U14==1 || answer.U14==2) ? "yell" : "ok") : "error";
    const battBreak = (answer.U08 == 0) ? ((answer.T20[3]==0) ? "close" : "open") : "none"
    const doorClosed = (answer.T20[4] == 0)
    const u1OutV = (answer.T20[4] == 1 && answer.U09 == 0) ? 0 : answer.F01
    return {
        temperature: answer.F04,     // Teplota akumulátora
        "capacity": answer.F05,      // Stav nabitia / vybitia akumulátora v % (odlišit barevně např. na 5 úrovní)
        outputVoltage_1: u1OutV,     // Výstupné napätie V1
        outputVoltage_2: answer.F02, // Výstupné napätie V2
        "load": answer.F15,          // Veľkosť zaťaženia v %
        current: answer.F03,         // Výstupný prúd
        "battBreak": battBreak,      // Istenie výstupu zdroja, akumulátora
        doorClosed: doorClosed,      // stav dvířek
        "outputVoltage": ov          // 230V připojeno/nepřipojeno
    }
}


async function connectToPowerSource()
{
    const options: HttpRequestOptions =
    {
        method: "GET",
        protocol: "http",
        host: "192.168.90.176",
        port: 80,
        path: "/shared.txt"
    }
    const response: any = await httpRequest(options)
    console.log(parseResponse(response))
}

const nameOfThisPackage = 'imco_power_monitor';

let settings: Settings;
let co: CamOverlayAPI;
let ceg: CamScripterAPICameraEventsGenerator;

function readSettings(): void {
    try {
        const data = fs.readFileSync(path.join(process.env.PERSISTENT_DATA_PATH, 'settings.json'));
        settings = JSON.parse(data.toString());
    } catch (error) {
        console.log('Cannot read Settings file: ', error.message);
        process.exit(1);
    }
}
function coSetup() {
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

async function cegSetup() {
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
}

async function main() {
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

// code for testing purposes
// remove before code review
import { CameraVapix } from 'camstreamerlib/CameraVapix';

const cv = new CameraVapix({ ip: settings.events_camera.ip, auth: 'root:admin' });
cv.on('tnsaxis:CameraApplicationPlatform/CamScripter/' + nameOfThisPackage, (event) => {
    console.log(event);
    console.log(event.params.notification.message);
});
cv.eventsConnect();
