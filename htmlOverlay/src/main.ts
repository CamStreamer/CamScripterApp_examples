import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { settingsSchema, TOverlaySettings } from './settingsSchema';

const overlayProcesses: ChildProcess[] = [];

function start() {
    const settings = readConfiguration();

    if (settings === undefined || settings.linuxUser.length === 0) {
        console.error('Linux user not set');
        setTimeout(() => {}, 300_000); // Prevent app from exiting
        return;
    }

    settings.overlayList.forEach((overlaySettings: TOverlaySettings) => {
        if (
            overlaySettings.enabled &&
            overlaySettings.imageSettings.url.length &&
            overlaySettings.cameraSettings.ip.length &&
            overlaySettings.cameraSettings.user.length &&
            overlaySettings.cameraSettings.pass.length &&
            overlaySettings.coSettings.cameraList !== null &&
            overlaySettings.coSettings.cameraList?.length
        ) {
            const scriptPath = path.join(__dirname, 'htmlToOverlayProcess.js');
            const child = spawn('sudo', [
                '-u',
                settings.linuxUser,
                'node',
                scriptPath,
                JSON.stringify(overlaySettings),
            ]);

            child.stdout?.on('data', (data) => {
                process.stdout.write(data);
            });

            child.stderr?.on('data', (data) => {
                process.stderr.write(data);
            });

            child.on('error', (error) => {
                console.error(`spawn error: ${error}`);
            });

            overlayProcesses.push(child);
        }
    });

    if (overlayProcesses.length === 0) {
        console.log('No configured HTML overlay found');
        setTimeout(() => {}, 300_000); // Prevent app from exiting
    }
}

function stopAllPackages() {
    overlayProcesses.forEach((child) => {
        child.kill();
    });
}

function readConfiguration() {
    try {
        const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        const parsedData = JSON.parse(data.toString());
        const result = settingsSchema.safeParse(parsedData);
        if (!result.success) {
            console.error('Invalid configuration:', result.error.errors);
            return undefined;
        }
        return result.data;
    } catch (err) {
        console.log('No configuration found');
        return undefined;
    }
}

process.on('SIGINT', () => {
    console.log('App exit - configuration changed');
    stopAllPackages();
    process.exit();
});

process.on('SIGTERM', () => {
    console.log('App exit');
    stopAllPackages();
    process.exit();
});

console.log('App started');
start();
