import * as fs from 'fs';
import * as net from 'net';
import { CameraVapix } from 'camstreamerlib/CameraVapix';
import { AxisCameraStation } from './AxisCameraStation';
import { AxisEvents } from './AxisEvents';
import { TAppSchema } from './schema';

let settings: TAppSchema;
let cv: CameraVapix;
let axisEvents: AxisEvents | undefined;
let acs: AxisCameraStation | undefined;
let client: net.Socket;
let prevWeightData: string | null = null;
let dataBuffer = '';

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

async function sendAcsEvent(result: string) {
    try {
        if (acs) {
            console.log(`Send ACS event, weight: ${result}`);
            await acs.sendEvent(result);
        }
        return true;
    } catch (err) {
        console.error('ACS event:', err instanceof Error ? err.message : 'unknown');
        return false;
    }
}

async function sendAxisEvent(result: string) {
    try {
        if (axisEvents) {
            console.log(`Send Axis event, weight: ${result}`);
            await axisEvents.sendEvent(result);
        }
        return true;
    } catch (err) {
        console.error('Axis event:', err instanceof Error ? err.message : 'unknown');
        return false;
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
                settings.event_camera.pass.length !== 0
            ) {
                axisEvents = new AxisEvents(settings.event_camera);
            } else {
                console.log('Axis Events is not configured and thus is disabled.');
            }
        }

        // Create camera client for http requests
        if (settings.camera.ip.length !== 0 && settings.camera.user.length !== 0 && settings.camera.pass.length !== 0) {
            cv = new CameraVapix({
                tls: settings.camera.protocol !== 'http',
                tlsInsecure: settings.camera.protocol === 'https_insecure',
                ip: settings.camera.ip,
                port: settings.camera.port,
                user: settings.camera.user,
                pass: settings.camera.pass,
            });
        }

        // Connect to electronic scale
        if (settings.scale.ip.length !== 0 && settings.scale.port !== 0 && cv !== undefined) {
            client = new net.Socket();
            client.connect(settings.scale.port, settings.scale.ip, () => {
                console.log('Scale connected');
                setInterval(() => {
                    client.write(Buffer.from('1B70', 'hex'));
                }, settings.scale.refresh_rate);
            });

            client.on('data', async (data) => {
                dataBuffer += data.toString('hex');
                const messageEnd = dataBuffer.indexOf('\r\n');
                if (messageEnd === -1) {
                    return;
                }
                const weightData = dataBuffer.substring(0, messageEnd);
                dataBuffer = '';

                if (prevWeightData !== weightData) {
                    prevWeightData = weightData;

                    // Parse weight and unit
                    const weight = prevWeightData.substring(0, 9);
                    const unit = prevWeightData.substring(9);
                    const result = weight + ' ' + unit;

                    try {
                        cv.vapixGet(
                            '/local/camoverlay/api/textAndBackground.cgi?service_id=' +
                                settings.camera.service_id +
                                '&' +
                                settings.camera.value_field_name +
                                '=' +
                                weight +
                                '&' +
                                settings.camera.unit_field_name +
                                '=' +
                                unit
                        ).then(
                            (response) => {
                                console.log(response);
                            },
                            function (err) {
                                console.error(err);
                            }
                        );
                    } catch (err) {
                        console.error('Camera overlay error: ' + err);
                    }

                    if (acs !== undefined) {
                        await sendAcsEvent(result);
                    }

                    if (axisEvents !== undefined) {
                        await sendAxisEvent(result);
                    }
                }
            });
        }
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
