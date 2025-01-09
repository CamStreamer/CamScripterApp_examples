import * as fs from 'fs';
import * as net from 'net';
import { TAppSchema } from './schema';
import { AxisCameraStation } from './AxisCameraStation';
import { AxisEvents } from './AxisEvents';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';
import { isConditionActive } from './utils';

let settings: TAppSchema;
let prevWeightData: string | null = null;
let dataBuffer = '';

let co: CamOverlayAPI | undefined;
let acs: AxisCameraStation | undefined;
let acsEventConditionTimer: NodeJS.Timeout | null = null;
let acsEventSendTimeStamp: number | null = null;
let axisEvents: AxisEvents | undefined;
let axisEventsConditionTimer: NodeJS.Timeout | null = null;
let axisEventsSentActiveState = false;

// Read script configuration
function readSettings() {
    try {
        const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        return JSON.parse(data.toString());
    } catch (err) {
        console.log('Read settings error:', err instanceof Error ? err.message : 'unknown');
        process.exit(1);
    }
}

async function sendAcsEventTimerCallback(weight: string, unit: string) {
    try {
        console.log(`Send ACS event, weight: ${weight} ${unit}`);
        await acs?.sendEvent(weight, unit);
        acsEventSendTimeStamp = Date.now();
    } catch (err) {
        console.error('ACS error:', err);
        acsEventConditionTimer = setTimeout(() => sendAcsEventTimerCallback(weight, unit), 5000);
    }
}

function checkCondtionAndSendAcsEvent(weight: string, unit: string) {
    try {
        const conditionActive = isConditionActive(
            Number.parseInt(weight),
            settings.acs.condition_operator,
            Number.parseInt(settings.acs.condition_value)
        );

        if (conditionActive) {
            if (acsEventConditionTimer) {
                if (
                    acsEventSendTimeStamp &&
                    settings.acs.repeat_after !== 0 &&
                    Date.now() - acsEventSendTimeStamp >= settings.acs.repeat_after * 1000
                ) {
                    clearTimeout(acsEventConditionTimer);
                    sendAcsEventTimerCallback(weight, unit);
                }
            } else {
                const timerTime = settings.acs.condition_delay * 1000;
                acsEventConditionTimer = setTimeout(() => sendAcsEventTimerCallback(weight, unit), timerTime);
            }
        } else if (acsEventConditionTimer) {
            acsEventSendTimeStamp = null;
            clearTimeout(acsEventConditionTimer);
            acsEventConditionTimer = null;
        }
    } catch (err) {
        console.error('ACS event:', err instanceof Error ? err.message : 'unknown');
    }
}

// Axis Events - check condition and send event
async function sendCameraEventTimerCallback(conditionActive: boolean, weight: string, unit: string) {
    try {
        if (conditionActive) {
            console.log(`Send Axis event, weight: ${weight} ${unit}`);
        }
        await axisEvents?.sendEvent(conditionActive);
        axisEventsSentActiveState = conditionActive;
        axisEventsConditionTimer = null;
    } catch (err) {
        console.error('Camera events error:', err);
        axisEventsConditionTimer = setTimeout(() => sendCameraEventTimerCallback(conditionActive, weight, unit), 5000);
    }
}

function checkCondtionAndSendCameraEvent(weight: string, unit: string) {
    try {
        const conditionActive = isConditionActive(
            Number.parseInt(weight),
            settings.event_camera.condition_operator,
            Number.parseInt(settings.event_camera.condition_value)
        );

        if (conditionActive !== axisEventsSentActiveState) {
            const timerTime = conditionActive ? settings.event_camera.condition_delay * 1000 : 0;
            if (axisEventsConditionTimer !== null) {
                clearTimeout(axisEventsConditionTimer);
            }
            axisEventsConditionTimer = setTimeout(async () => {
                await sendCameraEventTimerCallback(conditionActive, weight, unit);
                axisEventsSentActiveState = conditionActive;
            }, timerTime);
        }
    } catch (err) {
        console.error('Axis event:', err instanceof Error ? err.message : 'unknown');
    }
}

function main() {
    try {
        settings = readSettings();

        if (settings.acs.active) {
            if (
                settings.acs.ip.length !== 0 &&
                settings.acs.user.length !== 0 &&
                settings.acs.pass.length !== 0 &&
                settings.acs.source_key.length !== 0
            ) {
                acs = new AxisCameraStation(settings.acs);
            } else {
                console.log('Axis Camera Station is not configured and thus is disabled.');
            }
        }

        if (settings.event_camera.active) {
            if (
                settings.event_camera.ip.length !== 0 &&
                settings.event_camera.user.length !== 0 &&
                settings.event_camera.pass.length !== 0 &&
                settings.event_camera.condition_delay !== null &&
                settings.event_camera.condition_operator !== null &&
                settings.event_camera.condition_value !== null
            ) {
                axisEvents = new AxisEvents(settings.event_camera);
            } else {
                console.log('Axis Events is not configured and thus is disabled.');
            }
        }

        if (
            settings.camera.ip.length !== 0 &&
            settings.camera.user.length !== 0 &&
            settings.camera.pass.length !== 0 &&
            settings.camera.service_id >= 0
        ) {
            co = new CamOverlayAPI({
                tls: settings.camera.protocol !== 'http',
                tlsInsecure: settings.camera.protocol === 'https_insecure',
                ip: settings.camera.ip,
                port: settings.camera.port,
                user: settings.camera.user,
                pass: settings.camera.pass,
            });
            console.log('CoAPI connected');
        } else {
            console.log('CamOverlay is not configured and thus is disabled.');
        }

        // Connect to electronic scale
        const scaleClient = new net.Socket();
        scaleClient.connect(settings.scale.port, settings.scale.ip);

        scaleClient.on('connect', () => {
            console.log('Scale connected');
            setInterval(() => {
                scaleClient.write(Buffer.from('1B700D0A', 'hex'));
            }, settings.scale.refresh_rate);
        });

        scaleClient.on('data', async (data) => {
            dataBuffer += Buffer.from(data.toString());
            const messageEnd = dataBuffer.indexOf('\r\n');
            if (messageEnd === -1) {
                return;
            }
            const weightData = dataBuffer.substring(0, messageEnd);
            dataBuffer = '';

            if (prevWeightData !== weightData) {
                prevWeightData = weightData;

                // Parse weight and unit
                const weight = weightData.substring(0, 9).trim();
                const unit = weightData.substring(9).trim();

                // Show image in CamOverlay service
                if (co !== undefined) {
                    try {
                        await co.updateCGText(settings.camera.service_id, [
                            {
                                field_name: settings.camera.value_field_name,
                                text: weight,
                            },
                            {
                                field_name: settings.camera.unit_field_name,
                                text: unit,
                            },
                        ]);
                    } catch (err) {
                        console.error('CamOverlay error:', err);
                    }
                }

                // Send Camera Event
                if (axisEvents !== undefined && unit.length) {
                    checkCondtionAndSendCameraEvent(weight, unit);
                }

                // Send to Axis Camera Station. Unit is not empty when the weight is stable.
                if (acs !== undefined && weight !== '0' && unit.length) {
                    if (acsEventConditionTimer) {
                        clearTimeout(acsEventConditionTimer);
                        acsEventConditionTimer = null;
                    }
                    checkCondtionAndSendAcsEvent(weight, unit);
                }
            } else if (prevWeightData === weightData && acs !== undefined && settings.acs.repeat_after !== 0) {
                const weight = weightData.substring(0, 9).trim();
                const unit = weightData.substring(9).trim();

                checkCondtionAndSendAcsEvent(weight, unit);
            }
        });

        scaleClient.on('error', (err) => {
            console.error('Scale connection error:', err);
            process.exit(1);
        });

        scaleClient.on('close', () => {
            console.log('Scale connection closed');
            process.exit(0);
        });

        console.log('Application started');
    } catch (err) {
        console.error('Application start:', err);
        process.exit(1);
    }
}

process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled rejection:', err);
});

main();
