import * as fs from 'fs';
import { HttpServer } from 'camstreamerlib/HttpServer';
import { settingsSchema, TSettingsSchema } from './schema';
import { SpinelController } from './SpinelController';
import { Widget } from './Widget';

console.log('Starting Flowmeter Package...');

let settings: TSettingsSchema | undefined;
let widget: Widget | undefined;

const httpServer = new HttpServer();
httpServer.on('access', (msg) => {
    console.log(msg);
});
httpServer.on('error', (err) => {
    console.log(err);
});

httpServer.onRequest('/reset_counter.cgi', async (req, res) => {
    try {
        console.log('access: reset counter');
        if (!spinelController.isStarted()) {
            await spinelController.reset();
            res.statusCode = 200;
        } else {
            console.error('Cannot reset counter when the counting is running');
            res.statusCode = 400;
        }
    } catch (err) {
        console.error('Cannot reset counter, error:', err);
        res.statusCode = 500;
    } finally {
        res.end();
    }
});

httpServer.onRequest('/calibration_start.cgi', async (req, res) => {
    try {
        console.log('access: calibration start');
        await spinelController.calibrationStart();
        res.statusCode = 200;
    } catch (err) {
        console.error('Cannot start calibration, error:', err);
        res.statusCode = 500;
    } finally {
        res.end();
    }
});

httpServer.onRequest('/calibration_calibrate.cgi', async (req, res) => {
    try {
        console.log('access: calibration end');
        const url = new URL(req.url ?? '', 'http://127.0.0.1/');
        if (!url.searchParams.has('volume')) {
            throw new Error('volume not found');
        }
        const volume = parseFloat(url.searchParams.get('volume')!);
        if (isNaN(volume)) {
            throw new Error('invalid volume specified');
        }

        await spinelController.calibrationCalibrate(volume);
        res.statusCode = 200;
    } catch (err) {
        console.error('Cannot finish calibration, error:', err);
        res.statusCode = 500;
    } finally {
        res.end();
    }
});

const spinelController = new SpinelController();
spinelController.on('volume', async (volume: number) => {
    if (widget) {
        await widget.updateVolume(volume);
    }
});

async function start() {
    try {
        let oldSettings = '';
        if (settings) {
            const {
                widget: { start_time: tmp1, ...restWidget },
                ...restSettings
            } = settings;
            void tmp1;
            const restOfSettingsOld = { ...restWidget, ...restSettings };

            oldSettings = JSON.stringify(restOfSettingsOld);
        }

        settings = readConfiguration();

        const {
            widget: { start_time: tmp2, ...restWidget },
            ...restSettings
        } = settings;
        void tmp2;
        const restOfSettings = { ...restWidget, ...restSettings };

        const newSettings = JSON.stringify(restOfSettings);

        if (widget && oldSettings !== newSettings) {
            await widget.stop();
            widget = undefined;
        }
        if (!widget) {
            widget = new Widget(settings.camera, settings.widget);
        }
        if (settings.widget.start_time) {
            await spinelController.start();
        }
    } catch (err) {
        console.log(err);
    }
}

async function stop() {
    try {
        await spinelController.stop();
    } catch (err) {
        console.log(err);
    }
}

function readConfiguration() {
    try {
        const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        return settingsSchema.parse(JSON.parse(data.toString()));
    } catch (err) {
        console.log('Application is not configured or configuration error:', err);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    await stop();
    await start();
});

process.on('SIGTERM', async () => {
    await httpServer.close();
    await stop();
    process.exit(0);
});

void start();
