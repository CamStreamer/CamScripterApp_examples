import * as fs from 'fs';
import * as childProcess from 'child_process';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';

let settings = null;
try {
    const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    settings = JSON.parse(data.toString());
} catch (err) {
    console.log('No settings file found');
    process.exit(1);
}

const co = new CamOverlayAPI({
    ip: settings.camera_ip,
    port: settings.camera_port,
    auth: settings.camera_user + ':' + settings.camera_pass,
    serviceID: settings.service_id,
});

const UNITS = { f: '°F', c: '°C' };
const RATIOS = { f: [1.8, 32], c: [1, 0] }; //  relation to Celsius

function temperature(num, unit_tag) {
    const r = RATIOS[unit_tag];
    return (num * r[0] + r[1]).toFixed(2) + ' ' + UNITS[unit_tag];
}

async function onePeriod() {
    try {
        const child = childProcess.spawn('sudo', [process.env.INSTALL_PATH + '/temper/temper.py', '--json'], {
            stdio: ['inherit', 'pipe', 'inherit'],
        });
        child.stdout.on('data', async (data) => {
            try {
                let temp = null;
                let jsonData = JSON.parse(data.toString('utf-8'));
                if (!jsonData[0]) {
                    console.log('No data!');
                } else {
                    temp = jsonData[0]['internal temperature'];
                    console.log('Temperature: ' + temp);
                }

                const fields = [
                    {
                        field_name: settings.field_name,
                        text: temp ? temperature(temp, settings.unit) : 'No Data',
                    },
                ];
                await co.updateCGText(fields);
            } catch (error) {
                console.error(error);
            }
        });
        child.on('close', () => {
            console.log('measured!');
            setTimeout(onePeriod, 3000);
        });
    } catch (error) {
        console.error(error);
    }
}

onePeriod();
