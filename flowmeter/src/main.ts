import * as fs from 'fs';
import { HttpServer } from 'camstreamerlib/HttpServer';
import { settingsSchema, TSettings } from './schema';
import { SpinelController } from './SpinelController';
import { Widget } from './Widget';

let settings: TSettings | undefined;
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

function readConfiguration() {
    try {
        const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        return settingsSchema.parse(JSON.parse(data.toString()));
    } catch (err) {
        console.log('Application is not configured or configuration error:', err);
        process.exit(1);
    }
}

async function start() {
    try {
        console.log('Starting application...');
        settings = readConfiguration();

        if (widget) {
            widget.stop();
            widget = undefined;
        }
        widget = new Widget(settings);

        if (settings.started) {
            await spinelController.start();
        }
        console.log('Application started');
    } catch (err) {
        console.log('Application start:', err);
    }
}

async function stop() {
    try {
        await spinelController.stop();
    } catch (err) {
        console.log('Application stop:', err);
    }
}

process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled rejection:', err);
    process.exit(1);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received');
    await stop();
    await start();
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received');
    httpServer.close();
    await stop();
    process.exit(0);
});

void start();
