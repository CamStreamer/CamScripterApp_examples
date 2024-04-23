import * as fs from 'fs';
import * as https from 'https';
import { TempSensorReader } from './TempSensorReader';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';
import { CamScripterAPICameraEventsGenerator } from 'camstreamerlib/CamScripterAPICameraEventsGenerator';

let sensorReader: TempSensorReader = null;
let acsSendTimestamp: number = null;
let acsConditionTimer: NodeJS.Timeout = null;
let sentActiveState = false;
let cscConnected = false;
let cscEventDeclared = false;
let cscEventConditionTimer: NodeJS.Timeout = null;
let coUpdating = false;

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

const eventsConfigured =
    settings.event_camera_ip.length !== 0 &&
    settings.event_camera_user.length !== 0 &&
    settings.event_camera_pass.length !== 0 &&
    settings.event_condition_delay != null &&
    settings.event_condition_operator != null &&
    settings.event_condition_value != null;

let co: CamOverlayAPI = null;
if (coConfigured) {
    co = new CamOverlayAPI({
        tls: settings.camera_protocol !== 'http',
        tlsInsecure: settings.camera_protocol === 'https_insecure',
        ip: settings.camera_ip,
        port: settings.camera_port,
        auth: settings.camera_user + ':' + settings.camera_pass,
    });
}

let csc: CamScripterAPICameraEventsGenerator = null;
if (eventsConfigured) {
    csc = new CamScripterAPICameraEventsGenerator({
        tls: settings.event_camera_protocol !== 'http',
        tlsInsecure: settings.event_camera_protocol === 'https_insecure',
        ip: settings.event_camera_ip,
        port: settings.event_camera_port,
        auth: settings.event_camera_user + ':' + settings.event_camera_pass,
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
            updateCOGraphics(temperature.toFixed(1) + ' ' + UNITS[settings.unit]);
        }
        if (acsConfigured) {
            checkConditionAndSendAcsEvent(temperature);
        }

        if (eventsConfigured) {
            checkCondtionAndSendCameraEvent(temperature);
        }
    } catch (error) {
        nextCheckTimeout = 10000;
        sensorReader = null;
        console.error(error);
        if (coConfigured) {
            await updateCOGraphics('No Data');
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

async function updateCOGraphics(text: string) {
    try {
        if (coUpdating) {
            return;
        }
        coUpdating = true;
        await co.updateCGText(settings.service_id, [
            {
                field_name: settings.field_name,
                text,
            },
        ]);
        coUpdating = false;
    } catch (err) {
        console.error('Update CamOverlay graphics error:', err);
        setTimeout(() => {
            coUpdating = false;
        }, 10000);
    }
}

function checkConditionAndSendAcsEvent(temperature: number) {
    if (isConditionActive(temperature, settings.acs_condition_operator, settings.acs_condition_value)) {
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

async function checkCondtionAndSendCameraEvent(temperature: number) {
    try {
        const conditionActive = isConditionActive(
            temperature,
            settings.event_condition_operator,
            settings.event_condition_value
        );

        if (!(await connectCameraEvents())) {
            return;
        }

        if (!cscEventDeclared) {
            await declareCameraEvent();
            cscEventDeclared = true;
        }

        if (conditionActive != sentActiveState && (!cscEventConditionTimer || !conditionActive)) {
            const timerTime = conditionActive ? settings.event_condition_delay * 1000 : 0;
            clearTimeout(cscEventConditionTimer);
            cscEventConditionTimer = setTimeout(() => sendCameraEventTimerCallback(conditionActive), timerTime);
        }
    } catch (err) {
        console.error('Camera events error:', err);
    }
}

async function sendCameraEventTimerCallback(conditionActive: boolean) {
    try {
        await sendCameraEvent(conditionActive);
        sentActiveState = conditionActive;
        cscEventConditionTimer = null;
    } catch (err) {
        console.error('Camera events error:', err);
        cscEventConditionTimer = setTimeout(() => sendCameraEventTimerCallback(conditionActive), 5000);
    }
}

function isConditionActive(temperature: number, operator: number, conditionValue: number) {
    switch (operator) {
        case 0:
            return temperature === conditionValue;
        case 1:
            return temperature > conditionValue;
        case 2:
            return temperature < conditionValue;
        case 3:
            return temperature >= conditionValue;
        case 4:
            return temperature <= conditionValue;
    }
}

function sendAcsEvent(temperature: number) {
    return new Promise<void>((resolve, reject) => {
        const date = new Date();
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1, 2);
        const day = pad(date.getUTCDate(), 2);
        const hours = pad(date.getUTCHours(), 2);
        const minutes = pad(date.getUTCMinutes(), 2);
        const seconds = pad(date.getUTCSeconds(), 2);
        const dateString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const event = {
            addExternalDataRequest: {
                occurrenceTime: dateString,
                source: settings.acs_source_key,
                externalDataType: 'temper1fSensor',
                data: {
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
                port: settings.acs_port,
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

async function connectCameraEvents() {
    if (!cscConnected) {
        csc.removeAllListeners();
        csc.on('open', () => {
            console.log('CSc: connected');
            cscConnected = true;
        });

        csc.on('error', (err) => {
            console.log('CSc-Error: ' + err);
        });

        csc.on('close', () => {
            console.log('CSc-Error: connection closed');
            cscConnected = false;
            cscEventDeclared = false;
            sentActiveState = false;
        });

        await csc.connect();
    }
    return cscConnected;
}

function declareCameraEvent() {
    return csc.declareEvent({
        declaration_id: 'Temper1fSensor',
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
                value: 'Temper1fSensor',
                value_type: 'STRING',
                value_nice_name: 'CamScripter: Temper1fSensor',
            },
            {
                type: 'DATA',
                namespace: '',
                key: 'condition_active',
                value: false,
                value_type: 'BOOL',
                key_nice_name: 'React on active condition (settings in the script)',
                value_nice_name: 'Condition is active',
            },
        ],
    });
}

function sendCameraEvent(active: boolean) {
    return csc.sendEvent({
        declaration_id: 'Temper1fSensor',
        event_data: [
            {
                namespace: '',
                key: 'condition_active',
                value: active,
                value_type: 'BOOL',
            },
        ],
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

if (coConfigured || acsConfigured || eventsConfigured) {
    onePeriod();
} else {
    console.log('Application is not configured.');
    process.exit(1);
}
