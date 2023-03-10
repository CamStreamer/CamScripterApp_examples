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
            settings.coSettings.cameraList?.length
        ) {
            const htmlOvl = new HtmlToOverlay(settings);
            htmlOvl.start();
            overlayList.push(htmlOvl);
        }
    });

    if (overlayList.length === 0) {
        console.log('No configured HTML overlay found');
        setTimeout(() => {}, 300_000); // Prevent app from exiting
    }
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

async function stopAllPackages() {
    for (const overlay of overlayList) {
        await overlay.stop();
    }
}

process.on('SIGINT', async () => {
    console.log('App exit - configuration changed');
    await stopAllPackages();
    process.exit();
});

process.on('SIGTERM', async () => {
    console.log('App exit');
    await stopAllPackages();
    process.exit();
});

console.log('App started');
start();
