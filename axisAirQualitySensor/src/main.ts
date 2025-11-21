import * as fs from 'fs';
import { TServerData, serverDataSchema } from './schema';
import { Widget } from './graphics/Widget';
import { getTemperature, getSeverity } from './utils';
import { TData, TInfo, DEFAULT_DATA } from './constants';
import { DefaultClient } from 'camstreamerlib/cjs/node';

const RETRY_DELAY_MS = 5000;
const TIMEOUT_ERROR_RETRY_MS = 1000;
const TIMEOUT_MS = 300_000;

let settings: TServerData;
let widget: Widget | undefined;
let airQualityReader: boolean = false;
let client: DefaultClient | undefined;

let retryTimeout: NodeJS.Timeout | null = null;
let dataBuffer = '';
let prevData: Record<keyof TData, TInfo> | null = null;
let data: Record<keyof TData, TInfo> = DEFAULT_DATA;

function readSettings() {
    try {
        const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        return serverDataSchema.parse(JSON.parse(data.toString()));
    } catch (err) {
        console.log('Read settings error:', err instanceof Error ? err.message : 'unknown');
        process.exit(1);
    }
}

async function watchAirQualityData() {
    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }

    if (client) {
        try {
            dataBuffer = '';
            const response = await client.get({
                path: '/axis-cgi/airquality/metadata.cgi',
                headers: {
                    Accept: 'text/event-stream',
                },
                timeout: TIMEOUT_MS,
            });

            if (response.body === null) {
                console.error('No data:', response.statusText);
                return;
            }

            const decoder = new TextDecoder('utf-8');
            const stream = response.body;
            const reader = stream.getReader();

            // PM1.0 = 64, PM2.5 = 25, PM4.0 = 91, PM10.0 = 90, Temperature = 53, Humidity = 19, VOC = 85, NOx = 43, CO2 = 81, AQI = 100, Vaping = 0
            while (true) {
                const { done, value: chunk } = await reader.read();
                if (done) break;

                try {
                    if (typeof chunk === 'string') {
                        dataBuffer += chunk;
                        continue;
                    } else {
                        dataBuffer += decoder.decode(chunk, { stream: true });
                    }

                    const lines = dataBuffer.split('\n');
                    if (lines.length < 2) {
                        continue;
                    }

                    const lineIndex = lines.length - 2;
                    const values = lines[lineIndex].split(', ').map((value) => value.split(' = '));
                    dataBuffer = lines[lines.length - 1];

                    const unit = settings.widget.units;

                    for (const v of values) {
                        const [key, value] = v;

                        if (key === 'Temperature') {
                            data.Temperature = {
                                value: getTemperature(value, unit),
                                severity: getSeverity(key, parseFloat(value)),
                            };
                        } else {
                            const typedKey = key as keyof TData;
                            data[typedKey] = {
                                value: Number(value) % 1 === 0 ? Number(value) : Number(value).toFixed(1),
                                severity: getSeverity(typedKey, Number(value)),
                            };
                        }
                    }

                    const shouldUpdate = shouldUpdateWidget();
                    if (shouldUpdate) {
                        widget?.displayWidget(data, unit);
                    }
                } catch (err) {
                    console.error('Error processing stream data:', err);
                    reader.releaseLock();
                    break;
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'TimeoutError') {
                retryTimeout = setTimeout(watchAirQualityData, TIMEOUT_ERROR_RETRY_MS);
            } else {
                console.error('Error fetching air quality data:', err);
                console.log('Restarting air quality data watcher...');
                retryTimeout = setTimeout(watchAirQualityData, RETRY_DELAY_MS);
            }
        }
    } else {
        console.error('VapixAPI instance is not initialized.');
    }
}

function shouldUpdateWidget() {
    if (prevData === null) {
        prevData = { ...data };
        return true;
    }

    for (const key in data) {
        if (data[key as keyof TData].value !== prevData[key as keyof TData].value) {
            prevData = { ...data };
            return true;
        }
    }

    return false;
}

function main() {
    try {
        settings = readSettings();

        if (
            settings.source_camera.ip.length !== 0 &&
            settings.source_camera.user.length !== 0 &&
            settings.source_camera.pass.length !== 0
        ) {
            airQualityReader = true;
            client = new DefaultClient({
                ip: settings.source_camera.ip,
                port: settings.source_camera.port,
                user: settings.source_camera.user,
                pass: settings.source_camera.pass,
                tls: settings.source_camera.protocol !== 'http',
                tlsInsecure: settings.source_camera.protocol === 'https_insecure',
                keepAlive: true,
            });
        } else {
            console.log('The Axis Air Quality Sensor is not configured and thus is disabled.');
        }

        if (
            settings.output_camera.ip.length !== 0 &&
            settings.output_camera.user.length !== 0 &&
            settings.output_camera.pass.length !== 0
        ) {
            widget = new Widget(settings.output_camera, settings.widget);
        } else {
            console.log('The CamOverlay widget is not configured and thus is disabled.');
        }

        if (airQualityReader && widget) {
            console.log('Watching air quality data...');
            watchAirQualityData();
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

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received');
    process.exit(0);
});

main();
