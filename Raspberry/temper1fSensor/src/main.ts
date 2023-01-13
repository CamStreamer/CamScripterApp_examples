import * as fs from 'fs';
import * as https from 'https';
import { TempSensorReader } from './TempSensorReader';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';

let sensorReader: TempSensorReader = null;
let acsSendTimestamp: number = null;
let acsConditionTimer: NodeJS.Timeout = null;

let settings = null;
try {
    const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    settings = JSON.parse(data.toString());
} catch (err) {
    console.log('No settings file found');
    process.exit(1);
}

const coConfigured =
    settings.camera_ip.length !== 0 &&
    settings.camera_user.length !== 0 &&
    settings.camera_pass.length !== 0 &&
    settings.field_name.length !== 0;

const acsConfigured =
    settings.acs_ip?.length != 0 &&
    settings.acs_user?.length != 0 &&
    settings.acs_pass?.length != 0 &&
    settings.acs_source_key?.length != 0 &&
    settings.acs_condition_delay != null &&
    settings.acs_condition_operator != null &&
    settings.acs_condition_value != null;

let co: CamOverlayAPI = null;
if (coConfigured) {
    co = new CamOverlayAPI({
        tls: settings.acs_protocol !== 'http',
        tlsInsecure: settings.acs_protocol === 'https_insecure',
        ip: settings.camera_ip,
        port: settings.camera_port,
        auth: settings.camera_user + ':' + settings.camera_pass,
        serviceID: settings.service_id,
    });
}

async function onePeriod() {
    let nextCheckTimeout = 1000;
    try {
        if (sensorReader === null) {
            sensorReader = new TempSensorReader();
        }

        const sensorData = await sensorReader.readSensorData();
        const temperature = convertTemperature(sensorData.temp, settings.unit);

        if (coConfigured) {
            await co.updateCGText([
                {
                    field_name: settings.field_name,
                    text: temperature.toFixed(1) + ' ' + UNITS[settings.unit],
                },
            ]);
        }
        if (acsConfigured) {
            checkCondtionAndSendAcsEvent(temperature);
        }
    } catch (error) {
        nextCheckTimeout = 10000;
        sensorReader = null;
        console.error(error);
        if (coConfigured) {
            await co.updateCGText([
                {
                    field_name: settings.field_name,
                    text: 'No Data',
                },
            ]);
        }
    } finally {
        setTimeout(onePeriod, nextCheckTimeout);
    }
}

const UNITS = { f: '°F', c: '°C' };
const RATIOS = { f: [1.8, 32], c: [1, 0] }; //  Relation to Celsius
function convertTemperature(num: number, unitTag: string): number {
    const r = RATIOS[unitTag];
    return num * r[0] + r[1];
}

function checkCondtionAndSendAcsEvent(temperature: number) {
    if (isConditionActive(temperature)) {
        if (acsConditionTimer) {
            if (
                acsSendTimestamp &&
                settings.acs_repeat_after !== 0 &&
                Date.now() - acsSendTimestamp >= settings.acs_repeat_after * 1000
            ) {
                clearTimeout(acsConditionTimer);
                sendAcsEventTimerCallback(temperature);
            }
        } else {
            const timerTime = settings.acs_condition_delay * 1000;
            acsConditionTimer = setTimeout(() => sendAcsEventTimerCallback(temperature), timerTime);
        }
    } else if (acsConditionTimer) {
        acsSendTimestamp = null;
        clearTimeout(acsConditionTimer);
        acsConditionTimer = null;
    }
}

async function sendAcsEventTimerCallback(temperature: number) {
    try {
        await sendAcsEvent(temperature);
        acsSendTimestamp = Date.now();
    } catch (err) {
        console.error('ACS error:', err);
        acsConditionTimer = setTimeout(() => sendAcsEventTimerCallback(temperature), 5000);
    }
}

function isConditionActive(temperature: number) {
    switch (settings.acs_condition_operator) {
        case 0:
            return temperature === settings.acs_condition_value;
        case 1:
            return temperature > settings.acs_condition_value;
        case 2:
            return temperature < settings.acs_condition_value;
        case 3:
            return temperature >= settings.acs_condition_value;
        case 4:
            return temperature <= settings.acs_condition_value;
    }
}

function sendAcsEvent(temperature: number) {
    return new Promise<void>((resolve, reject) => {
        const date = new Date();
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth(), 2);
        const day = pad(date.getUTCDate(), 2);
        const hours = pad(date.getUTCHours(), 2);
        const minutes = pad(date.getUTCMinutes(), 2);
        const seconds = pad(date.getUTCSeconds(), 2);
        const dateString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const event = {
            addExternalDataRequest: {
                occurenceTime: dateString,
                source: settings.acs_source_key,
                externalDataType: 'temper1fSensor',
                data: {
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    temperature: temperature.toFixed(1),
                    unit: settings.unit.toUpperCase(),
                },
            },
        };
        const eventData = JSON.stringify(event);
        const req = https.request(
            {
                method: 'POST',
                host: settings.acs_ip,
                port: 55756,
                path: '/Acs/Api/ExternalDataFacade/AddExternalData',
                auth: settings.acs_user + ':' + settings.acs_pass,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': eventData.length,
                },
                rejectUnauthorized: false,
            },
            (res) => {
                if (res.statusCode == 200) {
                    resolve();
                } else {
                    reject(new Error(`status code: ${res.statusCode}`));
                }
            }
        );
        req.on('error', reject);
        req.write(eventData);
        req.end();
    });
}

function pad(num, size) {
    var sign = Math.sign(num) === -1 ? '-' : '';
    return (
        sign +
        new Array(size)
            .concat([Math.abs(num)])
            .join('0')
            .slice(-size)
    );
}

if (coConfigured || acsConfigured) {
    onePeriod();
} else {
    console.log('Application is not configured.');
    process.exit(1);
}
