import * as fs from 'fs';
import * as path from 'path';
import { setInterval } from 'timers/promises';
import { settingsSchema, type TSettings } from './schema';
import { DefaultAgent } from 'camstreamerlib/DefaultAgent';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';

function readSettings(): TSettings {
    const localdata = process.env.PERSISTENT_DATA_PATH ?? 'localdata';
    const buffer = fs.readFileSync(path.join(localdata, 'settings.json'));
    return settingsSchema.parse(JSON.parse(buffer.toString()));
}

async function main() {
    const settings = readSettings();

    const agent = new DefaultAgent({
        tls: settings.aoa.protocol !== 'http',
        tlsInsecure: settings.aoa.protocol !== 'https',
        ip: settings.aoa.ip,
        port: settings.aoa.port,
        user: settings.aoa.user,
        pass: settings.aoa.pass,
    });
    const co = new CamOverlayAPI({
        tls: settings.camera.protocol !== 'http',
        tlsInsecure: settings.camera.protocol !== 'https',
        ip: settings.camera.ip,
        port: settings.camera.port,
        user: settings.camera.user,
        pass: settings.camera.pass,
    });

    for await (const c of setInterval(1000 * settings.aoa.updateFrequency)) {
        void c;

        const req = {
            apiVersion: '1.2',
            method: settings.aoa.method,
            params: {
                scenario: settings.aoa.scenarioId,
            },
        };

        try {
            const res = await agent.post('/local/objectanalytics/control.cgi', JSON.stringify(req));
            const json = (await res.json()) as any;

            if (res.ok && Object.hasOwn(json, 'data') && Object.hasOwn(json.data, 'total')) {
                await co.updateCGText(settings.camera.serviceID, [
                    {
                        field_name: settings.camera.fieldName,
                        text: json.data.total,
                    },
                ]);
            } else if (Object.hasOwn(json, 'error')) {
                throw new Error(JSON.stringify(json.error));
            } else {
                throw new Error(JSON.stringify(res));
            }
        } catch (err) {
            console.warn(err);
        }
    }
}

process.on('uncaughtException', (error) => {
    console.warn('uncaughtException', error);
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    console.warn('unhandledRejection', error);
    process.exit(1);
});
void main();
