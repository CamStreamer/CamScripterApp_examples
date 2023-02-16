import * as fs from 'fs';
import { HtmlToOverlay, HtmlToOverlayOptions } from './htmlToOverlay';

let settingsList = null;
try {
    const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    settingsList = JSON.parse(data.toString());
} catch (err) {
    console.log('No settings file found');
    process.exit(1);
}

if (settingsList.length === 0) {
    console.log('Application is not configured.');
    process.exit(1);
}

const overlayList: HtmlToOverlay[] = [];
function start() {
    settingsList.forEach(async (settings: HtmlToOverlayOptions) => {
        startOverlay(settings);
    });
}

async function startOverlay(settings: HtmlToOverlayOptions) {
    try {
        if (
            settings.imageSettings.url.length &&
            settings.cameraSettings.ip.length &&
            settings.cameraSettings.user.length &&
            settings.cameraSettings.pass.length
        ) {
            const htmlOvl = new HtmlToOverlay(settings);
            await htmlOvl.start();
            overlayList.push(htmlOvl);
        }
    } catch (err) {
        console.error(settings.configName, err);
        setTimeout(() => startOverlay(settings), 10000);
    }
}

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

function cleanExit() {
    console.log('App exit');
    overlayList.forEach(async (htmlOverlay) => {
        await htmlOverlay.stop();
    });
    process.exit();
}

console.log('App started');
start();
