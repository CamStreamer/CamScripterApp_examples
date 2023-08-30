import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as https from 'https';

import { URLSearchParams } from 'url';
import { httpRequest, HttpRequestOptions } from 'camstreamerlib/HttpRequest';
import { CamOverlayDrawingAPI, UploadImageResponse } from 'camstreamerlib/CamOverlayDrawingAPI';

import CairoFrame from './CairoFrame';
import CairoPainter from './CairoPainter';

type SimInfo = {
    active: boolean;
    slot: number;
    operator: string;
    connectionType: string;
    strenght: number;
};
type ModemInfo = {
    name: string;
    wanIP: string;
    wanState: string;

    sim: SimInfo;
    wifi2: boolean;
    wifi5: boolean;

    ports: Record<number, boolean>;

    uptime: string;
    latitude: number;
    longitude: number;
    lastUpdateTime: string;
};
type Camera = {
    protocol: string;
    ip: string;
    port: number;
    user: string;
    password: string;
};
type Settings = {
    modem: {
        token: string;
        device: number;
        refresh_period: number;
    };
    co_camera: Camera;
    overlay: {
        scale: number;
        alignment: string;
        x: number;
        y: number;
        width: number;
        height: number;
    };
    map_camera: Camera;
    map: {
        x: number;
        y: number;
        alignment: string;
        width: number;
        height: number;

        map_width: number;
        map_height: number;
        zoomLevel: number;
        APIkey: string;
        tolerance: number;
    };
};
type Frames = {
    wanState: CairoFrame;
    routerName: CairoFrame;
    routerIP: CairoFrame;
    simInserted1: CairoFrame;
    operator1: CairoFrame;
    connectionType1: CairoFrame;
    signalStrenght1: CairoFrame;
    simInserted2: CairoFrame;
    operator2: CairoFrame;
    connectionType2: CairoFrame;
    signalStrenght2: CairoFrame;
    port1: CairoFrame;
    port2: CairoFrame;
    port3: CairoFrame;
    port4: CairoFrame;
    port5: CairoFrame;
    wifi2: CairoFrame;
    wifi5: CairoFrame;
    uptimeLogo: CairoFrame;
    uptime: CairoFrame;
    coordinatesLogo: CairoFrame;
    coordinates: CairoFrame;
    lastUpdate: CairoFrame;
};

const setTimeoutPromise = util.promisify(setTimeout);

let settings: Settings;

let co: CamOverlayDrawingAPI = null;
let coConnected = false;

let mapCO: CamOverlayDrawingAPI = null;
let mapCOconnected = false;

let images: Record<string, UploadImageResponse>;
let regular: string;
let bold: string;

let mapCP: CairoPainter;
let cp: CairoPainter;
let frames: Frames;

function allSettled(promises: Promise<void>[]): Promise<void> {
    return new Promise((resolve) => {
        let numberOfFulfilledPromise = 0;

        for (const promise of promises) {
            promise.then(
                () => {
                    numberOfFulfilledPromise += 1;
                    if (numberOfFulfilledPromise === promises.length) {
                        resolve();
                    }
                },
                (error) => {
                    console.error(error);
                    numberOfFulfilledPromise += 1;
                    if (numberOfFulfilledPromise === promises.length) {
                        resolve();
                    }
                }
            );
        }
    });
}

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
    return settings.modem.device !== null && settings.modem.token !== '' && (co !== null || mapCO !== null);
}
function coSetup(): void {
    const coCamera = settings.co_camera;
    const options = {
        ip: coCamera.ip,
        port: coCamera.port,
        auth: `${coCamera.user}:${coCamera.password}`,
        tls: coCamera.protocol !== 'http',
        tlsInsecure: coCamera.protocol === 'https_insecure',
    };
    co = new CamOverlayDrawingAPI(options);
    prepareCairoPainter();
}
function coConfigured(): boolean {
    const coCamera = settings.co_camera;
    return (
        coCamera.protocol !== '' &&
        coCamera.port !== null &&
        coCamera.ip !== '' &&
        coCamera.user !== '' &&
        coCamera.password !== ''
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
        width: 902,
        height: 930,
    });

    frames = {} as Frames;
    frames.wanState = new CairoFrame({
        x: 55,
        y: 62,
        width: 62,
        height: 59,
    });
    frames.routerName = new CairoFrame({
        x: 148,
        y: 64,
        width: 301,
        height: 35,
    });
    frames.routerIP = new CairoFrame({
        x: 632,
        y: 64,
        width: 221,
        height: 35,
    });
    frames.simInserted1 = new CairoFrame({
        x: 55,
        y: 158,
        width: 109,
        height: 146,
    });
    frames.operator1 = new CairoFrame({
        x: 189,
        y: 204,
        width: 281,
        height: 28,
    });
    frames.connectionType1 = new CairoFrame({
        x: 189,
        y: 244,
        width: 70,
        height: 37,
    });
    frames.signalStrenght1 = new CairoFrame({
        x: 265,
        y: 243,
        width: 51,
        height: 41,
    });
    frames.simInserted2 = new CairoFrame({
        x: 478,
        y: 158,
        width: 109,
        height: 146,
    });
    frames.operator2 = new CairoFrame({
        x: 620,
        y: 204,
        width: 281,
        height: 28,
    });
    frames.connectionType2 = new CairoFrame({
        x: 620,
        y: 244,
        width: 70,
        height: 37,
    });
    frames.signalStrenght2 = new CairoFrame({
        x: 695,
        y: 243,
        width: 51,
        height: 41,
    });
    frames.port1 = new CairoFrame({
        x: 55,
        y: 356,
        width: 94,
        height: 70,
    });
    frames.port2 = new CairoFrame({
        x: 200,
        y: 356,
        width: 94,
        height: 70,
    });
    frames.port3 = new CairoFrame({
        x: 345,
        y: 356,
        width: 94,
        height: 70,
    });
    frames.port4 = new CairoFrame({
        x: 490,
        y: 356,
        width: 94,
        height: 70,
    });
    frames.port5 = new CairoFrame({
        x: 634,
        y: 356,
        width: 94,
        height: 70,
    });
    frames.wifi2 = new CairoFrame({
        x: 55,
        y: 445,
        width: 306,
        height: 65,
    });
    frames.wifi5 = new CairoFrame({
        x: 483,
        y: 445,
        width: 270,
        height: 65,
    });
    frames.uptimeLogo = new CairoFrame({
        x: 55,
        y: 556,
        width: 57,
        height: 59,
    });
    frames.uptime = new CairoFrame({
        x: 148,
        y: 568,
        width: 508,
        height: 29,
    });
    frames.coordinatesLogo = new CairoFrame({
        x: 55,
        y: 645,
        width: 59,
        height: 79,
    });
    frames.coordinates = new CairoFrame({
        x: 148,
        y: 653,
        width: 525,
        height: 29,
    });
    frames.lastUpdate = new CairoFrame({
        x: 148,
        y: 694,
        width: 554,
        height: 25,
    });

    cp.insertAll(frames);
}
function mapCOsetup(): void {
    const map = settings.map;
    const mapCamera = settings.map_camera;

    const options = {
        ip: mapCamera.ip,
        port: mapCamera.port,
        auth: `${mapCamera.user}:${mapCamera.password}`,
        tls: mapCamera.protocol !== 'http',
        tlsInsecure: mapCamera.protocol === 'https_insecure',
    };
    mapCO = new CamOverlayDrawingAPI(options);
    mapCP = new CairoPainter({
        x: map.x,
        y: map.y,
        width: map.map_width,
        height: map.map_height,
        screen_width: map.width,
        screen_height: map.height,
        co_ord: map.alignment,
    });
}
function mapCOconfigured(): boolean {
    const mapCamera = settings.map_camera;
    return (
        mapCamera.protocol !== '' &&
        mapCamera.port !== null &&
        mapCamera.ip !== '' &&
        mapCamera.user !== '' &&
        mapCamera.password !== ''
    );
}

//  ----------------------
//  |  connect to modem  |
//  ----------------------

let portsInfo = [false, false, false, false, false];
function transformSignalStrenght(strenght: number): number | never {
    if (strenght > -57) {
        return 5;
    } else if (strenght > -67) {
        return 4;
    } else if (strenght > -82) {
        return 3;
    } else if (strenght > -97) {
        return 2;
    } else if (strenght > -111) {
        return 1;
    } else {
        return 0;
    }
}
function transformConnectionType(connectionType: string): string {
    if (['5G-NSA', '5G-SA'].includes(connectionType)) {
        return '5G';
    } else if (['LTE', 'CAT-M1', 'FDD LTE', 'TDD LTE'].includes(connectionType)) {
        return '4G';
    } else if (
        [
            'WCDMA',
            'HSDPA',
            'HSUPA',
            'HSPA',
            'HSPA+',
            'HSDPA and HSUPA',
            'HSDPA and H',
            'HSDPA+HSUPA',
            'DC-HSPA+',
        ].includes(connectionType)
    ) {
        return '3G';
    } else if (['CDMA', 'EDGE', 'GPRS', 'GSM', 'CAT-NB1'].includes(connectionType)) {
        return '2G';
    } else {
        return connectionType;
    }
}
function getUpdateTime(date: string): string {
    const d = new Date(date);
    let hour = d.getHours().toString();
    let minute = d.getMinutes().toString();
    let second = d.getSeconds().toString();

    if (hour.length === 1) {
        hour = '0' + hour;
    }
    if (minute.length === 1) {
        minute = '0' + minute;
    }
    if (second.length === 1) {
        second = '0' + second;
    }

    return `${d.getDate()}. ${d.getMonth()}. ${d.getFullYear()} ${hour}:${minute}:${second}`;
}
function parseUptime(uptime: number): string {
    let second = (uptime % 60).toString();
    uptime = Math.floor(uptime / 60);

    let minute = (uptime % 60).toString();
    uptime = Math.floor(uptime / 60);

    let hour = (uptime % 24).toString();
    uptime = Math.floor(uptime / 24);

    if (hour.length === 1) {
        hour = '0' + hour;
    }
    if (minute.length === 1) {
        minute = '0' + minute;
    }
    if (second.length === 1) {
        second = `0` + second;
    }

    return `${uptime}:${hour}:${minute}:${second}`;
}
function parseTeltonikaResponse(
    response: Record<string, unknown>,
    wireless: { ssid: string; active: number }[],
    ports: { id: number; name: string; type: string }[]
): ModemInfo {
    let wifi2 = false;
    let wifi5 = false;

    for (const { ssid, active } of wireless) {
        if (ssid === 'RUT_C52E_2G' && active === 1) {
            wifi2 = true;
        } else if (ssid === 'RUT_C52F_5G' && active === 1) {
            wifi5 = true;
        }
    }

    if (ports) {
        portsInfo = [false, false, false, false, false];
        for (const { name } of ports) {
            portsInfo[parseInt(name.split(' ')[1]) - 1] = true;
        }
    }

    return {
        name: response.name as string,
        wanIP: response.wan_ip as string,
        wanState: response.wan_state as string,

        sim: {
            active: response.sim_state === 'Inserted',
            slot: response.sim_slot as number,
            strenght: transformSignalStrenght(response.signal as number),
            operator: response.operator as string,
            connectionType: transformConnectionType(response.connection_type as string),
        },
        wifi2,
        wifi5,

        ports: portsInfo,

        uptime: parseUptime(response.router_uptime as number),
        latitude: response.latitude as number,
        longitude: response.longitude as number,
        lastUpdateTime: getUpdateTime(response.last_update_at as string),
    };
}
async function getModemInfo(): Promise<void> {
    try {
        const deviceID = settings.modem.device;

        const requestOptions: HttpRequestOptions = {
            method: 'GET',
            protocol: 'https:',
            host: 'rms.teltonika-networks.com',
            port: 443,
            path: '/api/devices/' + deviceID,

            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${settings.modem.token}`,
            },
        };

        let response = (await httpRequest(requestOptions)) as string;
        const parsedResponse = JSON.parse(response);

        requestOptions.path += '/wireless';
        response = (await httpRequest(requestOptions)) as string;
        const wireless = JSON.parse(response);

        requestOptions.path = `/api/devices/${deviceID}/port-scan?type=ethernet`;
        response = (await httpRequest(requestOptions)) as string;

        const channel = JSON.parse(response).meta.channel;
        requestOptions.path = '/status/channel/' + channel;

        await setTimeoutPromise(2000);
        response = (await httpRequest(requestOptions)) as string;
        const ports = JSON.parse(response).data[deviceID][0].ports;

        const mi: ModemInfo = parseTeltonikaResponse(parsedResponse.data, wireless.data, ports);

        const promises = new Array<Promise<void>>();
        if (co !== null && (await coConnect())) {
            promises.push(displayGraphics(mi));
        }
        if (mapCO !== null && (await mapCOconnect())) {
            promises.push(displayMap({ latitude: mi.latitude, longitude: mi.longitude }));
        }
        await allSettled(promises);
    } catch (error) {
        console.log(error.message);
    } finally {
        setTimeout(getModemInfo, 1000 * settings.modem.refresh_period);
    }
}

//  ---------------------------
//  |  connect to CamOverlay  |
//  ---------------------------

async function loadImages(): Promise<void> {
    const imageNames = ['background', 'uptime_logo', 'coordinates_logo', 'wan_wifi', 'wan_wired'];

    for (let f = 1; f <= 5; f += 1) {
        imageNames.push(`port_${f}_active`);
        imageNames.push(`port_${f}_inactive`);
    }
    for (let f = 1; f <= 2; f += 1) {
        imageNames.push(`wan_sim_${f}`);
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
    cp.setBgImage(images['background'], 'plain');

    frames.routerName.setFont(bold);
    frames.routerIP.setFont(bold);
    frames.connectionType1.setFont(bold);
    frames.operator1.setFont(bold);
    frames.connectionType2.setFont(bold);
    frames.operator2.setFont(bold);
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
async function displayGraphics(mi: ModemInfo) {
    const img = mi.sim.slot;

    if (mi.wanState === 'Mobile') {
        frames.wanState.setBgImage(images[`wan_sim_${img}`], 'stretch');
    } else if (mi.wanState === 'Wired') {
        frames.wanState.setBgImage(images[`wan_wired`], 'stretch');
    } else {
        frames.wanState.setBgImage(images[`wan_wifi`], 'stretch');
    }

    frames.routerName.setText(mi.name, 'A_LEFT');
    frames.routerIP.setText(mi.wanIP, 'A_RIGHT');

    if (img === 1) {
        frames.simInserted1.setBgImage(mi.sim.active ? images[`sim_1_active`] : images[`sim_1_inactive`], 'fit');
        frames.operator1.setText(mi.sim.operator, 'A_LEFT', 'TFM_TRUNCATE');
        frames.connectionType1.setText(mi.sim.connectionType, 'A_LEFT');
        frames.signalStrenght1.setBgImage(images['strength_' + mi.sim.strenght], 'fit');

        frames.simInserted2.setBgImage(images[`sim_2_inactive`], 'fit');
        frames.operator2.setText('', 'A_LEFT');
        frames.connectionType2.setText('', 'A_LEFT');
        frames.signalStrenght2.removeImage();
    } else {
        frames.simInserted2.setBgImage(mi.sim.active ? images[`sim_2_active`] : images[`sim_2_inactive`], 'fit');
        frames.operator2.setText(mi.sim.operator, 'A_LEFT', 'TFM_TRUNCATE');
        frames.connectionType2.setText(mi.sim.connectionType, 'A_LEFT');
        frames.signalStrenght2.setBgImage(images['strength_' + mi.sim.strenght], 'fit');

        frames.simInserted1.setBgImage(images[`sim_1_inactive`], 'fit');
        frames.operator1.setText('', 'A_LEFT');
        frames.connectionType1.setText('', 'A_LEFT');
        frames.signalStrenght1.removeImage();
    }

    frames.port1.setBgImage(mi.ports[0] ? images['port_1_active'] : images['port_1_inactive'], 'fit');
    frames.port2.setBgImage(mi.ports[1] ? images['port_2_active'] : images['port_2_inactive'], 'fit');
    frames.port3.setBgImage(mi.ports[2] ? images['port_3_active'] : images['port_3_inactive'], 'fit');
    frames.port4.setBgImage(mi.ports[3] ? images['port_4_active'] : images['port_4_inactive'], 'fit');
    frames.port5.setBgImage(mi.ports[4] ? images['port_5_active'] : images['port_5_inactive'], 'fit');

    frames.wifi2.setBgImage(mi.wifi2 ? images['wifi_2_active'] : images['wifi_2_inactive'], 'fit');
    frames.wifi5.setBgImage(mi.wifi5 ? images['wifi_5_active'] : images['wifi_5_inactive'], 'fit');

    frames.uptime.setText('Device uptime: ' + mi.uptime, 'A_LEFT');
    frames.coordinates.setText(`${mi.latitude} N, ${mi.longitude} E`, 'A_LEFT');
    frames.lastUpdate.setText('Last update: ' + mi.lastUpdateTime, 'A_LEFT');

    await cp.generate(co, (2 * settings.overlay.scale) / 3);
}

//  ---------
//  |  map  |
//  ---------

type Coordinates = {
    latitude: number;
    longitude: number;
};
function deg2rad(angle: number) {
    return (angle * Math.PI) / 180;
}
function calculateDistance(a: Coordinates, b: Coordinates) {
    const aLatRad = deg2rad(a.latitude);
    const aLonRad = deg2rad(a.longitude);
    const bLatRad = deg2rad(b.latitude);
    const bLonRad = deg2rad(b.longitude);

    const sinDiffLat = Math.sin((aLatRad - bLatRad) / 2);
    const sinDiffLon = Math.sin((aLonRad - bLonRad) / 2);
    const aCosLat = Math.cos(aLatRad);
    const bCosLat = Math.cos(bLatRad);

    const c = Math.pow(sinDiffLat, 2) + aCosLat * bCosLat * Math.pow(sinDiffLon, 2);
    return 2000 * 6371 * Math.asin(Math.sqrt(c));
}

let lastCoordinates: Coordinates = null;
async function getMapImage(actualCoordinates: Coordinates): Promise<Buffer> {
    const map = settings.map;
    return new Promise<Buffer>((resolve, reject) => {
        const params = {
            center: `${actualCoordinates.latitude},${actualCoordinates.longitude}`,
            zoom: map.zoomLevel.toString(),
            size: `${map.map_width}x${map.map_height}`,
            key: map.APIkey,
            markers: `${actualCoordinates.latitude},${actualCoordinates.longitude}`,
        };

        const path = '/maps/api/staticmap?' + new URLSearchParams(params).toString();

        const options: HttpRequestOptions = {
            host: 'maps.googleapis.com',
            port: 443,
            path: path,
        };

        let dataBuffer = Buffer.alloc(0);
        const request = https.request(options, (response) => {
            response.on('data', (chunk) => {
                dataBuffer = Buffer.concat([dataBuffer, chunk]);
            });
            response.on('error', (err) => {
                reject(err);
            });
            response.on('end', () => {
                resolve(dataBuffer);
            });
        });
        request.on('error', (err) => {
            reject(err);
        });
        request.end();
    });
}

async function displayMap(actualCoordinates: Coordinates) {
    const map = settings.map;
    try {
        if (
            actualCoordinates === null ||
            (lastCoordinates !== null && calculateDistance(lastCoordinates, actualCoordinates) < map.tolerance)
        ) {
            return;
        }
        lastCoordinates = actualCoordinates;
        const buffer = await getMapImage(actualCoordinates);

        const image = (await mapCO.uploadImageData(buffer)) as UploadImageResponse;

        mapCP.setBgImage(image, 'stretch');
        await mapCP.generate(mapCO);
    } catch (e) {
        console.error(e);
    }
}
async function mapCOconnect(): Promise<boolean> {
    if (!mapCOconnected) {
        mapCO.removeAllListeners();
        mapCO.on('open', () => {
            console.log('COAPI connected (map)');
            mapCOconnected = true;
        });
        mapCO.on('error', function (err) {
            console.log('COAPI-Error (map): ' + err);
        });
        mapCO.on('close', function () {
            console.log('COAPI-Error (map): connection closed');
            mapCOconnected = false;
        });

        await mapCO.connect();
    }
    return mapCOconnected;
}

//  ----------
//  |  main  |
//  ----------

function main() {
    process.on('uncaughtException', (e: Error) => {
        console.log('Uncaught exception:', e);
        process.exit(1);
    });
    process.on('unhandledRejection', (e: Error) => {
        console.log('Unhandled rejection:', e);
        process.exit(1);
    });

    settings = readSettings();

    if (coConfigured()) {
        coSetup();
    }
    if (mapCOconfigured()) {
        mapCOsetup();
    }

    if (!isSetup()) {
        console.error('Application is not configured');
        process.exit(1);
    }

    getModemInfo();
}

main();
