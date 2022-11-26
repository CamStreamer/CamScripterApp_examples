import * as fs from 'fs';
import { TempSensorReader } from './TempSensorReader';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';

let sensorReader: TempSensorReader = null;

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
const RATIOS = { f: [1.8, 32], c: [1, 0] }; //  Relation to Celsius
function temperature(num, unitTag) {
    const r = RATIOS[unitTag];
    return (num * r[0] + r[1]).toFixed(2) + ' ' + UNITS[unitTag];
}

async function onePeriod() {
    let nextCheckTimeout = 1000;
    try {
        if (sensorReader === null) {
            sensorReader = new TempSensorReader();
        }

        const sensorData = await sensorReader.readSensorData();
        await co.updateCGText([
            {
                field_name: settings.field_name,
                text: temperature(sensorData.temp, settings.unit),
            },
        ]);
    } catch (error) {
        nextCheckTimeout = 10000;
        sensorReader = null;
        console.error(error);
        await co.updateCGText([
            {
                field_name: settings.field_name,
                text: 'No Data',
            },
        ]);
    } finally {
        setTimeout(onePeriod, nextCheckTimeout);
    }
}

if (
    settings.camera_ip.length !== 0 &&
    settings.camera_user.length !== 0 &&
    settings.camera_pass.length !== 0 &&
    settings.field_name.length !== 0
) {
    onePeriod();
} else {
    console.log('Application is not configured.');
    process.exit(1);
}
