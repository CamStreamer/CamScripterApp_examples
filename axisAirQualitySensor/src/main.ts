import * as fs from 'fs';
import { TServerData, serverDataSchema } from './schema';
import { Widget } from './graphics/Widget';
import { getTemperature, getSeverity } from './utils';
import { TData, TInfo, DEFAULT_DATA } from './constants';

let settings: TServerData;
let widget: Widget | undefined;
let airQualityReader: boolean = false;

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
    console.log('Watching air quality data...');
    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }

    try {
        const response = await fetch(
            `${settings.source_camera.protocol}://${settings.source_camera.ip}/axis-cgi/airquality/metadata.cgi`,
            {
                headers: { Accept: 'text/event-stream' },
            }
        );

        if (response.body === null) {
            console.error('No data:', response.statusText);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    console.warn('Stream ended unexpectedly.');
                    break;
                }

                dataBuffer += decoder.decode(value, { stream: true });

                const lines = dataBuffer.split('\n');
                dataBuffer = lines.pop() || '';

                const values = lines[0].split(', ').map((value) => value.split(' = '));
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
                    console.log('update');
                    widget?.displayWidget(data, unit);
                }
            } catch (err) {
                console.error('Error processing stream data:', err);
                break;
            }
        }
    } catch (err) {
        console.error('Error fetching air quality data:', err);
    } finally {
        console.log('Restarting air quality data watcher...');
        retryTimeout = setTimeout(watchAirQualityData, 5000);
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
