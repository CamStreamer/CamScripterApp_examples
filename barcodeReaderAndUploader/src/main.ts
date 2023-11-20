import { loadSettings, settings } from './settings';
import { SharePoint } from './Upload/SharePoint/SharePoint';
import { Uploader } from './Upload/Uploader';

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

    const storage = new SharePoint(settings.storage);
    await storage.authenticate();
    await storage.getWebEndpoint();

    const uploader = new Uploader(storage, settings.storage);

    console.log('uploaded');
};

async function cleanExit() {
    try {
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
