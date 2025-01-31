import * as fs from 'fs';
import { HtmlToOverlay } from './htmlToOverlay';
import { settingsSchema, TSettings } from './settingsSchema';

let settingsList: TSettings = [];
const overlayList: HtmlToOverlay[] = [];

function start() {
    settingsList = readConfiguration();

    settingsList.forEach((settings: TSettings[0]) => {
        if (
            settings.imageSettings.url.length &&
            settings.cameraSettings.ip.length &&
            settings.cameraSettings.user.length &&
            settings.cameraSettings.pass.length &&
            settings.coSettings.cameraList !== null &&
            settings.coSettings.cameraList?.length
        ) {
            const htmlOvl = new HtmlToOverlay(settings);
            void htmlOvl.start();
            overlayList.push(htmlOvl);
        }
    });

    if (overlayList.length === 0) {
        console.log('No configured HTML overlay found');
        setTimeout(() => {}, 300_000); // Prevent app from exiting
    }
}

async function stopAllPackages() {
    await Promise.all(overlayList.map((overlay) => overlay.stop()));
}

function readConfiguration() {
    try {
        const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        const parsedData = JSON.parse(data.toString());
        const result = settingsSchema.safeParse(parsedData);
        if (!result.success) {
            console.error('Invalid configuration:', result.error.errors);
            return [];
        }
        return result.data;
    } catch (err) {
        console.log('No configuration found');
        return [];
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
