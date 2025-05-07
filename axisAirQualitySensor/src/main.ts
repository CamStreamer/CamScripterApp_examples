import * as fs from 'fs';
import { TServerData, serverDataSchema } from './schema';
import { Widget } from './Widget';
import { HttpServer } from 'camstreamerlib/HttpServer';

let settings: TServerData;
let widget: Widget | undefined;
let httpServer: HttpServer | undefined;

function readSettings() {
    try {
        const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        return serverDataSchema.parse(JSON.parse(data.toString()));
    } catch (err) {
        console.log('Read settings error:', err instanceof Error ? err.message : 'unknown');
        process.exit(1);
    }
}

async function showWidget(code: string, visibilityTimeSec: number, shouldShowWidget: boolean) {
    try {
        if (widget && shouldShowWidget) {
            console.log(`Display widget, code: "${code}"`);
            await widget.showBarCode(code, visibilityTimeSec);
            return true;
        }
        return false;
    } catch (err) {
        console.error('Show widget:', err instanceof Error ? err.message : 'unknown');
        return false;
    }
}

function main() {
    try {
        settings = readSettings();
        if (
            settings.output_camera.ip.length !== 0 &&
            settings.output_camera.user.length !== 0 &&
            settings.output_camera.pass.length !== 0
        ) {
            widget = new Widget(settings.output_camera, settings.widget);
        } else {
            console.log('The CamOverlay widget is not configured and thus is disabled.');
        }

        console.log('Application started');
    } catch (err) {
        console.error('Application start:', err);
        httpServer?.close();
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
    httpServer?.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received');
    httpServer?.close();
    process.exit(0);
});

main();
