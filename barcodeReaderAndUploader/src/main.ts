import * as fs from 'fs';

import { loadSettings, settings } from './settings';

import { LedIndicator } from './LedIndicator';
import { SharePoint } from './Upload/SharePoint/SharePoint';
import { Uploader } from './Upload/Uploader';

let ledIndicator: LedIndicator;

process.on('SIGINT', async () => {
    console.log('Configuration changed');
    cleanExit();
});

process.on('SIGTERM', async () => {
    console.log('App exit');
    cleanExit();
});

const start = async () => {
    await loadSettings();
    console.log('started');

    ledIndicator = new LedIndicator({
        camera: settings.camera,
        ledSettings: settings.ledSettings,
    });
    ledIndicator.indicateOnScriptStart();

    const storage = new SharePoint(settings.storage);
    await storage.authenticate();
    await storage.getWebEndpoint();

    const uploader = new Uploader(storage, settings.storage);

    console.log('uploaded');
};

async function cleanExit() {
    try {
        await ledIndicator.destructor();
        //        if (co && coConnected) {
        //            await co.removeImage();
        //        }
    } catch (err) {
        console.error('Hide graphics: ', err);
    } finally {
        process.exit();
    }
}

start();
