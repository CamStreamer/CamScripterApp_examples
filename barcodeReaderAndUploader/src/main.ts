import * as fs from 'fs';

import { loadSettings, settings } from './settings';

import { LedIndicator } from './LedIndicator';
import { SharePoint } from './Upload/SharePoint/SharePoint';
import { Uploader } from './Upload/Uploader';
import { DrawWidget } from './DrawWidget/DrawWidget';
import { getCameraImage } from './getCameraImage';
import { PortReader } from './QrReaderByPort/PortReader';

const READ_BARCODE_HIGHLIGHT_DURATION_MS = 500;
const UPLOADS_HIGHLIGHT_DURATION_MS = 3000;

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
    const storage = new SharePoint(settings.storage);
    await storage.authenticate();
    await storage.getWebEndpoint();
    const uploader = new Uploader(storage, settings.storage);

    const drawWidget = new DrawWidget();
    await drawWidget.connect();
    const portReader = new PortReader();

    ledIndicator = new LedIndicator({
        camera: settings.camera,
        ledSettings: settings.ledSettings,
    });

    portReader.on('final_bar_code', async (barcode: string) => {
        console.log('readed code - ', barcode);
        try {
            ledIndicator.indicateSuccess(READ_BARCODE_HIGHLIGHT_DURATION_MS);
            await drawWidget.createBarcodeWidget(barcode);
            const image = await getCameraImage();
            if (image === undefined) return;
            await uploader.uploadFile(image, `${barcode}.jpg`);
            ledIndicator.indicateSuccess(UPLOADS_HIGHLIGHT_DURATION_MS);
        } catch (error) {
            console.error(error);
            ledIndicator.indicateFailure();
        }
    });

    ledIndicator.indicateOnScriptStart();

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
