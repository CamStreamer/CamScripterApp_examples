import * as fs from 'fs';
import { HtmlToOverlay, HtmlToOverlayOptions } from './htmlToOverlay';

let settingsList = [];
const overlayList: HtmlToOverlay[] = [];

function start() {
    settingsList = readConfiguration();

    settingsList.forEach((settings: HtmlToOverlayOptions) => {
        if (
            settings.imageSettings.url.length &&
            settings.cameraSettings.ip.length &&
            settings.cameraSettings.user.length &&
            settings.cameraSettings.pass.length &&
            settings.coSettings.cameraList.length
        ) {
            const htmlOvl = new HtmlToOverlay(settings);
            htmlOvl.start();
            overlayList.push(htmlOvl);
        }
    });
}

function readConfiguration() {
    try {
        const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        return JSON.parse(data.toString());
    } catch (err) {
        console.log('No configuration found');
        return [];
    }
}

process.on('SIGINT', async () => {
    console.log('Reload configuration');
    process.exit();
});

process.on('SIGTERM', () => {
    console.log('App exit');
    process.exit();
});

console.log('App started');
start();
