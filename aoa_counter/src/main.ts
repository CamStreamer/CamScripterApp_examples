import { setInterval } from 'timers/promises';
import { readSettings } from './settings';
import { DefaultAgent } from 'camstreamerlib/DefaultAgent';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';

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

            if (res.ok) {
                const json = JSON.parse(await res.text());

                await co.updateCGText(settings.camera.serviceID, [
                    {
                        field_name: settings.camera.fieldName,
                        text: json.data.total,
                    },
                ]);
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
