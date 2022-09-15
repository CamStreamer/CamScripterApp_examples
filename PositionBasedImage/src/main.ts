import * as fs from 'fs';
import * as net from 'net';
import * as https from 'https';
import { URLSearchParams } from 'url';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';

type Camera = {
    IP: string;
    port: number;
    user: string;
    password: string;
};

type Coordinates = {
    latitude: number;
    longitude: number;
};

type Settings = {
    targetCamera: Camera;
    width: number;
    height: number;
    zoomLevel: number;
    updatePeriod: number;
    positionX: number;
    positionY: number;
    APIkey: string;
    tolerance: number;
    enableMapCO: boolean;
    streamWidth: number;
    streamHeight: number;
    areas: {
        coordinates: Coordinates;
        radius: number;
        serviceIDs: number[];
    }[];
};

let activeServices: number[] = [];
let settings: Settings;
const cos: Record<number, CamOverlayAPI> = {};
let mapCO: CamOverlayAPI;

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

function serverResponseParse(lines: string[]): Coordinates {
    let returnValue = null;

    for (const line of lines) {
        const items = line.split(',');
        if (
            items.length >= 7 &&
            items[0] === '$GPRMC' &&
            items[3] !== '' &&
            items[4] !== '' &&
            items[5] !== '' &&
            items[6] !== ''
        ) {
            let lat = Number.parseFloat(items[3]) / 100;
            let lon = Number.parseFloat(items[5]) / 100;

            const latD = Math.floor(lat);
            const latM = ((lat - Math.floor(lat)) * 100) / 60;
            lat = latD + latM;

            const lonD = Math.floor(lon);
            const lonM = ((lon - Math.floor(lon)) * 100) / 60;
            lon = lonD + lonM;

            if (items[4] == 'S') {
                lat *= -1;
            }
            if (items[6] == 'W') {
                lon *= -1;
            }
            returnValue = { latitude: lat, longitude: lon };
        }
    }
    return returnValue;
}

async function synchroniseCamOverlay() {
    for (const idString in cos) {
        const id = Number.parseInt(idString);
        const isEnabled = await cos[id].isEnabled();
        if (!isEnabled && activeServices.includes(id)) {
            cos[id].setEnabled(true);
        } else if (isEnabled && !activeServices.includes(id)) {
            cos[id].setEnabled(false);
        }
    }
}

function isEqual(a: number[], b: number[]) {
    let equal = a.length == b.length;
    if (equal) {
        for (let i = 0; i < a.length && equal; i++) {
            equal = equal && a[i] == b[i];
        }
    }
    return equal;
}

function getServiceIDs(actualCoordinates: Coordinates) {
    for (const area of settings.areas) {
        const distance = calculateDistance(actualCoordinates, area.coordinates);
        if (distance <= area.radius) {
            return area.serviceIDs.sort();
        }
    }
    return [];
}

function serverConnect() {
    const server = net.createServer((client) => {
        client.setTimeout(30000);

        let dataBuffer = Buffer.alloc(0);
        client.on('data', (data) => {
            dataBuffer = Buffer.concat([dataBuffer, data]);

            const lines = data.toString().split('\r\n');
            lines.pop();
            const coor = serverResponseParse(lines);
            dataBuffer = Buffer.from(lines[lines.length - 1]);

            if (coor !== null) {
                actualCoordinates = coor;
                const ids = getServiceIDs(coor);

                if (!isEqual(ids, activeServices)) {
                    activeServices = ids;
                    synchroniseCamOverlay();
                }
            }
        });

        client.on('timeout', () => {
            console.log('Client request time out.');
            client.end();
            process.exit(1);
        });
    });

    server.listen(10110, () => {
        server.on('close', () => {
            console.log('TCP server socket is closed.');
            process.exit(1);
        });

        server.on('error', (error) => {
            console.log(JSON.stringify(error));
            process.exit(1);
        });

        setInterval(synchroniseCamOverlay, 60000);
    });
}

let actualCoordinates: Coordinates = null;
let lastCoordinates: Coordinates = null;
function getMapImage() {
    return new Promise<Buffer>((resolve, reject) => {
        const params = {
            center: `${actualCoordinates.latitude},${actualCoordinates.longitude}`,
            zoom: settings.zoomLevel.toString(),
            size: `${settings.width}x${settings.height}`,
            key: settings.APIkey,
            markers: `${actualCoordinates.latitude},${actualCoordinates.longitude}`,
        };

        const path = '/maps/api/staticmap?' + new URLSearchParams(params).toString();
        const options = {
            host: 'maps.googleapis.com',
            port: 443,
            path: path,
        };

        let dataBuffer = Buffer.alloc(0);
        const request = https.request(options, (response) => {
            response.on('data', (chunk) => {
                dataBuffer = Buffer.concat([dataBuffer, chunk]);
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

async function synchroniseMap() {
    try {
        if (
            actualCoordinates == null ||
            (lastCoordinates != null && calculateDistance(lastCoordinates, actualCoordinates) < settings.tolerance)
        ) {
            return;
        }
        lastCoordinates = actualCoordinates;
        const buffer = await getMapImage();

        const image = ((await mapCO.uploadImageData(buffer)) as any).var;
        const surface = (
            (await mapCO.cairo(
                'cairo_image_surface_create',
                'CAIRO_FORMAT_ARGB32',
                settings.width,
                settings.height
            )) as any
        ).var;
        const cairo = ((await mapCO.cairo('cairo_create', surface)) as any).var;

        mapCO.cairo('cairo_set_source_surface', cairo, image, 0, 0);
        mapCO.cairo('cairo_paint', cairo);
        mapCO.showCairoImageAbsolute(
            surface,
            settings.positionX,
            settings.positionY,
            settings.streamWidth,
            settings.streamHeight
        );
        mapCO.cairo('cairo_surface_destroy', image);
        mapCO.cairo('cairo_surface_destroy', surface);
        mapCO.cairo('cairo_destroy', cairo);
    } catch (e) {
        console.log(e);
    } finally {
        setTimeout(synchroniseMap, 1000 * settings.updatePeriod);
    }
}

async function openMap() {
    const options = {
        ip: settings.targetCamera.IP,
        port: settings.targetCamera.port,
        auth: settings.targetCamera.user + ':' + settings.targetCamera.password,
        serviceName: 'Position Based Image',
    };
    mapCO = new CamOverlayAPI(options);
    mapCO.on('error', (error) => {
        console.log(error);
        process.exit(1);
    });
    await mapCO.connect();
    if (settings.enableMapCO) {
        synchroniseMap();
    } else {
        mapCO.removeImage();
    }
}

async function main() {
    try {
        const path = process.env.PERSISTENT_DATA_PATH;
        const data = fs.readFileSync(path + 'settings.json');
        settings = JSON.parse(data.toString());

        if (settings.updatePeriod == null || settings.updatePeriod < 1) {
            settings.updatePeriod = 4;
        }
    } catch (error) {
        console.log('Error with Settings file: ', error);
        return;
    }

    const serviceIDs: number[] = [];
    for (const area of settings.areas) {
        area.serviceIDs.sort();

        for (const serviceID of area.serviceIDs) {
            serviceIDs.push(serviceID);
        }
    }

    for (const serviceID of serviceIDs) {
        const options = {
            ip: settings.targetCamera.IP,
            port: settings.targetCamera.port,
            auth: `${settings.targetCamera.user}:${settings.targetCamera.password}`,
            serviceID,
        };
        try {
            const co = new CamOverlayAPI(options);
            await co.connect();
            await co.setEnabled(false);
            cos[serviceID] = co;
        } catch (error) {
            console.log(`Cannot connect to CamOverlay service with ID ${serviceID}`);
            console.log(error);
        }
    }
    await openMap();
    serverConnect();
}

process.on('unhandledRejection', (reason) => {
    console.log(reason);
    process.exit(1);
});

main();
