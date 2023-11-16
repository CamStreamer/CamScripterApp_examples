import * as fs from 'fs';
import { loadSettings, settings } from 'settings';

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
