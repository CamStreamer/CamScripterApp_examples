import * as fs from 'fs';
import * as path from 'path';

import { CamOverlayDrawingAPI, UploadImageResponse } from 'camstreamerlib/CamOverlayDrawingAPI';

import CairoFrame from './CairoFrame';
import CairoPainter from './CairoPainter';

type SimInfo = {
    active: boolean;
    operator: string;
    connection_type: string;
    strenght: number;
};
type ModemInfo = {
    name: string;
    wan_ip: string;

    sim_1: SimInfo;
    sim_2: SimInfo;
    wifi_2: boolean;
    wifi_5: boolean;

    ports: Record<number, boolean>;

    uptime: number;
    latitude: number;
    longitude: number;
    last_update_time: string;
};
type Camera = {
    protocol: string;
    ip: string;
    port: number;
    user: string;
    password: string;
};
type Settings = {
    co_camera: Camera;
    overlay: {
        scale: number;
        alignment: string;
        x: number;
        y: number;
        width: number;
        height: number;
    };
};
type Frames = {
    routerName: CairoFrame;
    routerIP: CairoFrame;
    simInserted: CairoFrame;
    operator: CairoFrame;
    connectionType: CairoFrame;
    signalStrenght: CairoFrame;
    port_1: CairoFrame;
    port_2: CairoFrame;
    port_3: CairoFrame;
    port_4: CairoFrame;
    port_5: CairoFrame;
    wifi_2: CairoFrame;
    wifi_5: CairoFrame;
    uptimeLogo: CairoFrame;
    uptime: CairoFrame;
    coordinatesLogo: CairoFrame;
    coordinates: CairoFrame;
    lastUpdate: CairoFrame;
};

let settings: Settings;
let co: CamOverlayDrawingAPI = null;
let coConnected = false;

let images: Record<string, UploadImageResponse>;
let regular: string;
let bold: string;

let cp: CairoPainter;
let frames: Frames;

//  -----------
//  |  setup  |
//  -----------

function readSettings(): Settings {
    try {
        const data = fs.readFileSync(path.join(process.env.PERSISTENT_DATA_PATH, 'settings.json'));
        return JSON.parse(data.toString());
    } catch (error) {
        console.error('Cannot read Settings file: ', error.message);
        process.exit(1);
    }
}
function isSetup(): boolean {
    return co != null;
}
async function coSetup(): Promise<void> {
    const co_camera = settings.co_camera;
    const options = {
        ip: co_camera.ip,
        port: co_camera.port,
        auth: `${co_camera.user}:${co_camera.password}`,
        tls: co_camera.protocol != 'http',
        tlsInsecure: co_camera.protocol == 'https_insecure',
    };
    co = new CamOverlayDrawingAPI(options);
    prepareCairoPainter();
}
function coConfigured(): boolean {
    const co_camera = settings.co_camera;
    return (
        co_camera.protocol != '' &&
        co_camera.port != null &&
        co_camera.ip != '' &&
        co_camera.user != '' &&
        co_camera.password != ''
    );
}
function prepareCairoPainter(): void {
    const overlay = settings.overlay;
    cp = new CairoPainter({
        x: overlay.x,
        y: overlay.y,
        screen_width: overlay.width,
        screen_height: overlay.height,
        co_ord: overlay.alignment,
        width: 980,
        height: 930,
    });

    frames = {} as Frames;
    frames.routerName = new CairoFrame({
        x: 0,
        y: 0,
        width: 300,
        height: 50,
    });
    frames.routerIP = new CairoFrame({
        x: 350,
        y: 0,
        width: 300,
        height: 50,
    });
    frames.simInserted = new CairoFrame({
        x: 0,
        y: 50,
        width: 109,
        height: 146,
    });
    frames.operator = new CairoFrame({
        x: 110,
        y: 50,
        width: 300,
        height: 50,
    });
    frames.connectionType = new CairoFrame({
        x: 110,
        y: 100,
        width: 50,
        height: 50,
    });
    frames.signalStrenght = new CairoFrame({
        x: 160,
        y: 100,
        width: 51,
        height: 41,
    });
    frames.port_1 = new CairoFrame({
        x: 0,
        y: 200,
        width: 94,
        height: 70,
    });
    frames.port_2 = new CairoFrame({
        x: 80,
        y: 200,
        width: 94,
        height: 70,
    });
    frames.port_3 = new CairoFrame({
        x: 160,
        y: 200,
        width: 94,
        height: 70,
    });
    frames.port_4 = new CairoFrame({
        x: 240,
        y: 200,
        width: 94,
        height: 70,
    });
    frames.port_5 = new CairoFrame({
        x: 320,
        y: 200,
        width: 94,
        height: 70,
    });
    frames.wifi_2 = new CairoFrame({
        x: 0,
        y: 400,
        width: 306,
        height: 65,
    });
    frames.wifi_5 = new CairoFrame({
        x: 400,
        y: 400,
        width: 270,
        height: 65,
    });
    frames.uptimeLogo = new CairoFrame({
        x: 0,
        y: 500,
        width: 57,
        height: 59,
    });
    frames.uptime = new CairoFrame({
        x: 100,
        y: 500,
        width: 300,
        height: 50,
    });
    frames.coordinatesLogo = new CairoFrame({
        x: 0,
        y: 600,
        width: 59,
        height: 79,
    });
    frames.coordinates = new CairoFrame({
        x: 100,
        y: 600,
        width: 300,
        height: 50,
    });
    frames.lastUpdate = new CairoFrame({
        x: 100,
        y: 650,
        width: 300,
        height: 50,
    });

    cp.insertAll(frames);
}

//  ----------------------
//  |  connect to modem  |
//  ----------------------

function getTime(date: string): string {
    const d = new Date(date);
    let hour = d.getHours().toString();
    let minute = d.getMinutes().toString();
    let second = d.getSeconds().toString();

    if (hour.length == 1) {
        hour = '0' + hour;
    }
    if (minute.length == 1) {
        minute = '0' + minute;
    }
    if (second.length == 1) {
        second = '0' + second;
    }

    return `${hour}:${minute}:${second}`;
}
async function getModemInfo(deviceID = 859233): Promise<ModemInfo> {
    return {
        name: 'Test RUTX50',
        wan_ip: '100.106.115.186',

        sim_1: {
            strenght: 4,
            connection_type: '5G',
            active: true,
            operator: 'Voda-Foun',
        },
        sim_2: null,
        wifi_2: true,
        wifi_5: false,

        ports: [null, true, false, true, false, true],

        uptime: 415491,
        latitude: 48.790625,
        longitude: 14.269965,
        last_update_time: getTime('2023-08-14 07:02:34'),
    };
}

//  ---------------------------
//  |  connect to CamOverlay  |
//  ---------------------------

async function loadImages(): Promise<void> {
    const imageNames = ['background', 'uptime_logo', 'coordinates_logo'];

    for (let f = 1; f <= 5; f += 1) {
        imageNames.push(`port_${f}_active`);
        imageNames.push(`port_${f}_inactive`);
    }
    for (let f = 1; f <= 2; f += 1) {
        imageNames.push(`sim_${f}_active`);
        imageNames.push(`sim_${f}_inactive`);
    }
    for (let f = 2; f <= 5; f += 3) {
        imageNames.push(`wifi_${f}_active`);
        imageNames.push(`wifi_${f}_inactive`);
    }
    for (let f = 0; f <= 5; f += 1) {
        imageNames.push(`strength_${f}`);
    }

    images = {};

    for (const image of imageNames) {
        images[image] = await co.uploadImageData(fs.readFileSync('img/' + image + '.png'));
    }
}
async function loadFonts(): Promise<void> {
    regular = (await co.uploadFontData(fs.readFileSync('./fonts/gotham_regular.ttf'))).var;
    bold = (await co.uploadFontData(fs.readFileSync('./fonts/gotham_bold.ttf'))).var;
}
function updateFrames(): void {
    cp.setBgImage(images['background'], 'fit');

    frames.routerName.setFont(bold);
    frames.routerIP.setFont(bold);
    frames.connectionType.setFont(bold);
    frames.operator.setFont(bold);
    frames.uptime.setFont(bold);
    frames.coordinates.setFont(bold);
    frames.lastUpdate.setFont(regular);

    frames.uptimeLogo.setBgImage(images['uptime_logo'], 'fit');
    frames.coordinatesLogo.setBgImage(images['coordinates_logo'], 'fit');
}
async function coConnect(): Promise<boolean> {
    if (!coConnected) {
        co.removeAllListeners();
        co.on('open', () => {
            console.log('COAPI connected');
            coConnected = true;
        });

        co.on('error', function (err) {
            console.log('COAPI-Error: ' + err);
        });
        co.on('close', function () {
            console.log('COAPI-Error: connection closed');
            coConnected = false;
        });

        await co.connect();
        await loadImages();
        await loadFonts();
        updateFrames();
    }
    return coConnected;
}
function draw(mi: ModemInfo) {
    frames.routerName.setText(mi.name, 'A_LEFT');
    frames.routerIP.setText(mi.wan_ip, 'A_LEFT');

    frames.simInserted.setBgImage(mi.sim_1.active ? images['sim_1_active'] : images['sim_1_inactive'], 'fit');
    frames.operator.setText(mi.sim_1.operator, 'A_LEFT');
    frames.connectionType.setText(mi.sim_1.connection_type, 'A_LEFT');
    frames.signalStrenght.setBgImage(images['strength_' + mi.sim_1.strenght], 'fit');

    frames.port_1.setBgImage(mi.ports[1] ? images['port_1_active'] : images['port_1_inactive'], 'fit');
    frames.port_2.setBgImage(mi.ports[2] ? images['port_2_active'] : images['port_2_inactive'], 'fit');
    frames.port_3.setBgImage(mi.ports[3] ? images['port_3_active'] : images['port_3_inactive'], 'fit');
    frames.port_4.setBgImage(mi.ports[4] ? images['port_4_active'] : images['port_4_inactive'], 'fit');
    frames.port_5.setBgImage(mi.ports[5] ? images['port_5_active'] : images['port_5_inactive'], 'fit');

    frames.wifi_2.setBgImage(mi.wifi_2 ? images['wifi_2_active'] : images['wifi_2_inactive'], 'fit');
    frames.wifi_5.setBgImage(mi.wifi_5 ? images['wifi_5_active'] : images['wifi_5_inactive'], 'fit');

    frames.uptime.setText('Device uptime: ' + mi.uptime, 'A_LEFT');
    frames.coordinates.setText(`${mi.latitude} N, ${mi.longitude} E`, 'A_LEFT');
    frames.lastUpdate.setText('Last update: ' + mi.last_update_time, 'A_LEFT');
}

//  ----------
//  |  main  |
//  ----------

async function main() {
    process.on('uncaughtException', (e: Error) => {
        console.log('Uncaught exception:', e);
        process.exit();
    });
    process.on('unhandledRejection', (e: Error) => {
        console.log('Unhandled rejection:', e);
        process.exit();
    });

    settings = readSettings();

    if (coConfigured()) {
        await coSetup();
    }

    if (!isSetup()) {
        console.error('Application is not configured');
        process.exit(1);
    }

    const mi = await getModemInfo();

    await coConnect();
    draw(mi);
    cp.generate(co, settings.overlay.scale);
}

main();
