import * as fs from 'fs';
import * as path from 'path';

import { setInterval } from 'timers/promises';
import { settingsSchema, TSettings } from './schema';
import { DefaultAgent } from 'camstreamerlib/DefaultAgent';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';
import { xml2js, ElementCompact } from 'xml-js';

function readSettings(): TSettings {
    const localdata = process.env.PERSISTENT_DATA_PATH ?? 'localdata';
    const buffer = fs.readFileSync(path.join(localdata, 'settings.json'));
    return settingsSchema.parse(JSON.parse(buffer.toString()));
}
async function getTemperature(agent: DefaultAgent, portID: string): Promise<number> {
    const res = await agent.get('/fresh.xml');

    if (res.ok) {
        const xml: ElementCompact = xml2js(await res.text(), { compact: true });
        const values = xml['root']['sns'];

        for (const v of values) {
            if (v._attributes.id === portID) {
                return v._attributes.val;
            }
        }
        throw new Error('Papago port not found.');
    } else {
        throw new Error(JSON.stringify(res));
    }
}
async function main() {
    const settings = readSettings();

    const agent = new DefaultAgent({
        tls: settings.papago.protocol !== 'http',
        tlsInsecure: settings.papago.protocol !== 'https',
        ip: settings.papago.ip,
        port: settings.papago.port,
    });
    const co = new CamOverlayAPI({
        tls: settings.camera.protocol !== 'http',
        tlsInsecure: settings.camera.protocol !== 'https',
        ip: settings.camera.ip,
        port: settings.camera.port,
        user: settings.camera.user,
        pass: settings.camera.pass,
    });

    for await (const c of setInterval(1000 * settings.papago.updateFrequency)) {
        void c;
        try {
            const temperature = await getTemperature(agent, settings.papago.portID);
            await co.updateCGText(settings.camera.serviceID, [
                { field_name: settings.camera.fieldName, text: `${temperature} °C` },
            ]);
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
