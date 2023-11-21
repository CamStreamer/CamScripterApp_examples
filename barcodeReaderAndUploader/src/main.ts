import * as fs from 'fs';

import { loadSettings, settings } from './settings';

import { LedIndicator } from './LedIndicator';
import { SharePoint } from './Upload/SharePoint/SharePoint';
import { Uploader } from './Upload/Uploader';
import { DrawWidget } from './DrawWidget/DrawWidget';
import { getCameraImage } from './getCameraImage';
import { PortReader } from './QrReaderByPort/PortReader';

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

    const drawWidget = new DrawWidget();
    await drawWidget.connect();
    const portReader = new PortReader();

    portReader.on('final_bar_code', async (data) => {
        console.log('valid_reading - ', data);
        await drawWidget.createBarcodeWidget(data);
        const image = await getCameraImage();
        if (image === undefined) return;
        await uploader.uploadFile(image, 'test1.jpg');
    });

    console.log('App started');
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
