import * as fs from 'fs';
import * as net from 'net';
import * as util from 'util';
import { CamOverlayAPI, CairoCreateResponse } from 'camstreamerlib/CamOverlayAPI';
import { httpRequest } from 'camstreamerlib/HTTPRequest';

const setTimeoutPromise = util.promisify(setTimeout);

const DATA_REQUEST_INTERVAL = 5000;
const SCALE_CONNECTION_TIMEOUT = 15000;
let dataRequestTimer: NodeJS.Timeout = null;
let scaleConnectionTimeoutTimer: NodeJS.Timeout = null;

type CoordSystem = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';

type WeightInfo = {
    dataAvailable: boolean;
    stable: boolean;
    value: string;
    unit: string;
};

let settings = null;
try {
    const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    settings = JSON.parse(data.toString());
} catch (err) {
    console.log('No settings file found');
    process.exit(1);
}

const scaleConfigured = settings.scale_ip.length !== 0;

const coConfigured =
    settings.camera_ip.length !== 0 &&
    settings.camera_user.length !== 0 &&
    settings.camera_pass.length !== 0 &&
    (settings.widget_type === 'generated' || settings.cg_field_name.length !== 0);

const acsConfigured =
    settings.acs_ip.length != 0 &&
    settings.acs_user.length != 0 &&
    settings.acs_pass.length != 0 &&
    settings.acs_source_key.length != 0;

let scaleSocket: net.Socket = null;
let lastWeightInfo: WeightInfo = null;
let co: CamOverlayAPI = null;
let coConnected = false;
let bgImage: string;

function connectToScale(ip: string, port: number) {
    scaleSocket = net.createConnection(port, ip);

    scaleSocket.on('connect', () => {
        console.log('Scale connection established');
        if (settings.scale_data_type === 'weight') {
            scaleSocket.write('SRU\r\n');
        } else {
            setInterval(() => {
                scaleSocket.write('PCS\r\n');
            }, 1000);
        }
    });

    let dataBuffer = Buffer.alloc(0);
    scaleSocket.on('data', (buffer) => {
        try {
            dataBuffer = Buffer.concat([dataBuffer, buffer]);
            const lines = dataBuffer.toString().split('\r\n');
            if (lines.length >= 2) {
                dataBuffer = Buffer.from(lines[lines.length - 1]);

                const weightInfo = getWeightInfo(lines[lines.length - 2]);
                if (
                    weightInfo &&
                    (!weightInfo.dataAvailable || weightInfo.stable) &&
                    (!lastWeightInfo ||
                        weightInfo.dataAvailable != lastWeightInfo.dataAvailable ||
                        weightInfo.value != lastWeightInfo.value ||
                        weightInfo.unit != lastWeightInfo.unit)
                ) {
                    lastWeightInfo = weightInfo;

                    displayGraphics(weightInfo);
                    sendAcsEvent(weightInfo);
                }

                // Ask periodically for data when there is not data change
                if (settings.scale_data_type === 'weight') {
                    clearTimeout(dataRequestTimer);
                    dataRequestTimer = setTimeout(() => {
                        scaleSocket.write('SRU\r\n');
                    }, DATA_REQUEST_INTERVAL);
                }

                // If there is no data at all report an error
                clearTimeout(scaleConnectionTimeoutTimer);
                if (weightInfo?.stable) {
                    // Start timer olny for stable weights because the scale doesn't send data if the weight is constantly changing
                    scaleConnectionTimeoutTimer = setTimeout(() => {
                        console.error('Scale connection timeout');
                        scaleSocket.destroy();
                    }, SCALE_CONNECTION_TIMEOUT);
                }
            }
        } catch (err) {
            console.error(err);
            cleanExit();
        }
    });

    scaleSocket.on('error', (error) => {
        console.error('Scale connection error:', error);
    });

    scaleSocket.on('close', () => {
        console.log('Scale connection closed');
        lastWeightInfo = null;
        displayGraphics({ dataAvailable: false, stable: false, value: '', unit: '' });
        setTimeout(() => connectToScale(ip, port), 5000);
    });
}

function getWeightInfo(data: string): WeightInfo {
    const items = data.replace(/\s+/g, ' ').split(' ');
    if (items.length === 0) {
        throw new Error('Invalid scale response: ' + data);
    }

    if (items[1] === 'I') {
        return {
            dataAvailable: false,
            stable: false,
            value: '',
            unit: '',
        };
    }

    if (settings.scale_data_type === 'pcs' && items[0] === 'PCS') {
        return {
            dataAvailable: true,
            stable: items[1] === 'S',
            value: items[2],
            unit: 'pcs',
        };
    } else if (settings.scale_data_type === 'weight') {
        if (items.length < 4) {
            throw new Error('Invalid scale response: ' + data);
        }
        return {
            dataAvailable: true,
            stable: items[1] === 'S',
            value: items[2],
            unit: items[3],
        };
    }
    return null;
}

async function displayGraphics(weightInfo: WeightInfo) {
    try {
        if (!coConfigured) {
            return;
        }

        if (await initCamOverlay()) {
            if (settings.widget_type === 'generated') {
                await drawWidget(weightInfo);
            } else {
                await co.updateCGText([
                    {
                        field_name: settings.cg_field_name,
                        text: weightInfoToString(weightInfo),
                    },
                ]);
            }
        }
    } catch (err) {
        console.error('Update image: ', err.message);
    }
}

async function initCamOverlay() {
    if (!coConnected) {
        co = new CamOverlayAPI({
            ip: settings.camera_ip,
            port: settings.camera_port,
            auth: settings.camera_user + ':' + settings.camera_pass,
            serviceName: 'MettlerToledoPlugin',
            serviceID: settings.widget_type === 'generated' ? undefined : settings.cg_service_id,
        });

        if (settings.widget_type === 'generated') {
            co.on('open', () => {
                console.log('COAPI: connected');
                coConnected = true;
            });

            co.on('error', (err) => {
                console.log('COAPI-Error: ' + err);
            });

            co.on('close', () => {
                console.log('COAPI-Error: connection closed');
                coConnected = false;
            });

            await co.connect();
            await setTimeoutPromise(1000);
        } else {
            coConnected = true;
        }
    }
    return coConnected;
}

async function drawWidget(weightInfo: WeightInfo) {
    const widgetWidth = Math.round(720 * settings.widget_scale);
    const widgetHeight = Math.round(192 * settings.widget_scale);

    const surfaceResponse = (await co.cairo(
        'cairo_image_surface_create',
        'CAIRO_FORMAT_ARGB32',
        widgetWidth,
        widgetHeight
    )) as CairoCreateResponse;
    const surface = surfaceResponse.var;

    const cairoResponse = (await co.cairo('cairo_create', surface)) as CairoCreateResponse;
    const cairo = cairoResponse.var;

    const bgImage = await loadBackground();
    co.cairo('cairo_scale', cairo, settings.widget_scale, settings.widget_scale);
    co.cairo('cairo_translate', cairo, 0, 0);
    co.cairo('cairo_set_source_surface', cairo, bgImage, 0, 0);
    co.cairo('cairo_paint', cairo);

    co.cairo('cairo_set_source_rgb', cairo, 0.9, 0.9, 0.9);
    co.writeText(cairo, weightInfoToString(weightInfo), 180, 25, 490, 110, 'A_RIGHT', 'TFM_SCALE');

    const pos = computePosition(
        settings.widget_coord_system,
        settings.widget_pos_x,
        settings.widget_pos_y,
        widgetWidth,
        widgetHeight,
        settings.widget_stream_width,
        settings.widget_stream_height
    );
    await co.showCairoImageAbsolute(surface, pos.x, pos.y, settings.widget_stream_width, settings.widget_stream_height);

    co.cairo('cairo_surface_destroy', surface);
    co.cairo('cairo_destroy', cairo);
}

async function loadBackground() {
    if (bgImage) {
        return bgImage;
    }
    return await loadImage('background.png');
}

async function loadImage(fileName) {
    const imgData = fs.readFileSync(fileName);
    const imgResponse = (await co.uploadImageData(imgData)) as CairoCreateResponse;
    return imgResponse.var;
}

function computePosition(
    coordSystem: CoordSystem,
    posX: number,
    posY: number,
    width: number,
    height: number,
    streamWidth: number,
    streamHeight: number
) {
    let x = posX;
    let y = posY;
    switch (coordSystem) {
        case 'top_right':
            x = streamWidth - width - posX;
            break;
        case 'bottom_left':
            y = streamHeight - height - posY;
            break;
        case 'bottom_right':
            x = streamWidth - width - posX;
            y = streamHeight - height - posY;
            break;
    }
    return { x, y };
}

function weightInfoToString(weightInfo: WeightInfo) {
    if (!weightInfo.dataAvailable) {
        return 'NO DATA';
    }

    if (weightInfo.unit.length !== 0) {
        return `${weightInfo.value} ${weightInfo.unit}`;
    }
    return weightInfo.value;
}

async function sendAcsEvent(weightInfo: WeightInfo) {
    try {
        if (!acsConfigured || !weightInfo.dataAvailable) {
            return;
        }

        const date = new Date();
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth(), 2);
        const day = pad(date.getUTCDate(), 2);
        const hours = pad(date.getUTCHours(), 2);
        const minutes = pad(date.getUTCMinutes(), 2);
        const seconds = pad(date.getUTCSeconds(), 2);
        const dateString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const event = {
            addExternalDataRequest: {
                occurenceTime: dateString,
                source: settings.acs_source_key,
                externalDataType: 'mettlerToledoPlugin',
                data: {
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    value: weightInfo.value,
                    unit: weightInfo.unit,
                },
            },
        };
        const eventData = JSON.stringify(event);
        await httpRequest(
            {
                protocol: settings.acs_protocol === 'http' ? 'http:' : 'https:',
                method: 'POST',
                host: settings.acs_ip,
                port: 55756,
                path: '/Acs/Api/ExternalDataFacade/AddExternalData',
                auth: settings.acs_user + ':' + settings.acs_pass,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': eventData.length,
                },
                rejectUnauthorized: settings.acs_protocol !== 'https_insecure',
            },
            eventData
        );
    } catch (err) {
        console.error('Send ACS event: ', err.message);
    }
}

function pad(num, size) {
    var sign = Math.sign(num) === -1 ? '-' : '';
    return (
        sign +
        new Array(size)
            .concat([Math.abs(num)])
            .join('0')
            .slice(-size)
    );
}

process.on('SIGINT', async () => {
    console.log('Configuration changed');
    await cleanExit();
});

process.on('SIGTERM', async () => {
    console.log('App exit');
    await cleanExit();
});

async function cleanExit() {
    try {
        if (scaleSocket) {
            scaleSocket.destroy();
        }
        if (co && coConnected && settings.widget_type === 'generated') {
            await co.removeImage();
        }
    } catch (err) {
        console.error('Hide graphics: ', err);
    } finally {
        process.exit();
    }
}

console.log('App started');
if (scaleConfigured && (coConfigured || acsConfigured)) {
    connectToScale(settings.scale_ip, settings.scale_port);
} else {
    console.log('Application is not configured');
    process.exit(1);
}
