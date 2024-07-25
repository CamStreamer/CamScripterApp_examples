import * as fs from 'fs';
import * as util from 'util';
import * as QRCode from 'qrcode';
import * as MemoryStream from 'memorystream';
import { CamOverlayDrawingAPI, TCairoCreateResponse } from 'camstreamerlib/CamOverlayDrawingAPI';
import { sendRequest } from 'camstreamerlib/internal/HttpRequest';
import { QRCodeReader } from './qrCodeReader';

const setTimeoutPromise = util.promisify(setTimeout);

let co: CamOverlayDrawingAPI | undefined;
let coConnected = false;
let barcodeFont = '';
let displayTimer: NodeJS.Timeout | undefined;

type CoordSystem = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';

let settings: any = null;
try {
    const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    settings = JSON.parse(data.toString());
} catch (err) {
    console.log('No settings file found');
    process.exit(1);
}

const coConfigured =
    settings.camera_ip.length !== 0 && settings.camera_user.length !== 0 && settings.camera_pass.length !== 0;

const acsConfigured =
    settings.acs_ip.length != 0 &&
    settings.acs_user.length != 0 &&
    settings.acs_pass.length != 0 &&
    settings.acs_source_key.length != 0;

function start() {
    const qrCodeReader = new QRCodeReader();
    qrCodeReader.on('valid_reading', (data) => {
        console.log('valid reading: ', data);
        displayGraphics(data.code);
        sendAcsEvent(data.code);
    });
}

async function displayGraphics(text: string) {
    try {
        if (!coConfigured) {
            return;
        }
        if (await initCamOverlay()) {
            if (settings.widget_graphic_type === 'qr_code') {
                await createQrCodeWidget(text);
            } else {
                await createBarcodeWidget(text);
            }

            clearTimeout(displayTimer);
            if (settings.widget_visibility_time !== 0) {
                displayTimer = setTimeout(() => {
                    if (co) {
                        co.removeImage();
                    }
                    displayTimer = undefined;
                }, settings.widget_visibility_time * 1000);
            }
        }
    } catch (err) {
        console.error('Update image: ', err instanceof Error ? err.message : 'Unknown Error');
    }
}

async function initCamOverlay() {
    if (!coConnected) {
        co = new CamOverlayDrawingAPI({
            tls: settings.camera_protocol !== 'http',
            tlsInsecure: settings.camera_protocol === 'https_insecure',
            ip: settings.camera_ip,
            port: settings.camera_port,
            user: settings.camera_user,
            pass: settings.camera_pass,
            camera: settings.widget_camera_list,
        });

        co.on('open', () => {
            console.log('COAPI: connected');
            coConnected = true;
            uploadFont();
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
    }
    return coConnected;
}

async function createQrCodeWidget(text: string) {
    if (!co) {
        return;
    }

    const widgetWidth = Math.round(300 * settings.widget_scale);
    const widgetHeight = Math.round(320 * settings.widget_scale);
    const surfaceResponse = (await co.cairo(
        'cairo_image_surface_create',
        'CAIRO_FORMAT_ARGB32',
        widgetWidth,
        widgetHeight
    )) as TCairoCreateResponse;
    const surface = surfaceResponse.var;
    const cairoResponse = (await co.cairo('cairo_create', surface)) as TCairoCreateResponse;
    const cairo = cairoResponse.var;

    const imageDataBuffer = await generateQrCode(text, widgetWidth);
    const imgResponse = (await co.uploadImageData(imageDataBuffer)) as TCairoCreateResponse;
    const qrImage = imgResponse.var;
    co.cairo('cairo_translate', cairo, 0, 0);
    co.cairo('cairo_set_source_surface', cairo, qrImage, 0, 0);
    co.cairo('cairo_paint', cairo);

    co.cairo('cairo_scale', cairo, settings.widget_scale, settings.widget_scale);
    co.cairo('cairo_rectangle', cairo, 0, 300, 300, 20);
    co.cairo('cairo_set_source_rgb', cairo, 1.0, 1.0, 1.0);
    co.cairo('cairo_fill', cairo);
    co.cairo('cairo_stroke', cairo);

    co.cairo('cairo_set_source_rgb', cairo, 0.0, 0.0, 0.0);
    co.writeText(cairo, text, 5, 270, 290, 30, 'A_CENTER', 'TFM_SCALE');

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

    co.cairo('cairo_surface_destroy', qrImage);
    co.cairo('cairo_surface_destroy', surface);
    co.cairo('cairo_destroy', cairo);
}

async function createBarcodeWidget(text: string) {
    if (!co) {
        return;
    }

    const widgetWidth = Math.round(600 * settings.widget_scale);
    const widgetHeight = Math.round(130 * settings.widget_scale);
    const surfaceResponse = (await co.cairo(
        'cairo_image_surface_create',
        'CAIRO_FORMAT_ARGB32',
        widgetWidth,
        widgetHeight
    )) as TCairoCreateResponse;
    const surface = surfaceResponse.var;
    const cairoResponse = (await co.cairo('cairo_create', surface)) as TCairoCreateResponse;
    const cairo = cairoResponse.var;

    // Measure the size of the barcode
    co.cairo('cairo_set_font_face', cairo, barcodeFont);
    co.cairo('cairo_set_font_size', cairo, 70);
    const textExtents = ((await co.cairo('cairo_text_extents', cairo, `*${text}*`)) as any).var;
    const margin = 60;
    const barcodeWidth = Math.min(600 - margin, textExtents.width);

    // Fill the background
    co.cairo('cairo_scale', cairo, settings.widget_scale, settings.widget_scale);
    co.cairo('cairo_rectangle', cairo, 0, 0, barcodeWidth + margin, 320);
    co.cairo('cairo_set_source_rgb', cairo, 1.0, 1.0, 1.0);
    co.cairo('cairo_fill', cairo);
    co.cairo('cairo_stroke', cairo);

    // Write the barcode and the text below it
    const textPos = margin / 2;
    co.cairo('cairo_set_font_face', cairo, barcodeFont);
    co.cairo('cairo_set_font_size', cairo, 70);
    co.cairo('cairo_set_source_rgb', cairo, 0.0, 0.0, 0.0);
    co.writeText(cairo, `*${text}*`, textPos, 5, barcodeWidth, 70, 'A_CENTER', 'TFM_SCALE');

    co.cairo('cairo_set_font_face', cairo, 'NULL');
    co.writeText(cairo, text, textPos, 80, barcodeWidth, 30, 'A_CENTER', 'TFM_SCALE');

    const pos = computePosition(
        settings.widget_coord_system,
        settings.widget_pos_x,
        settings.widget_pos_y,
        (barcodeWidth + margin) * settings.widget_scale,
        widgetHeight,
        settings.widget_stream_width,
        settings.widget_stream_height
    );
    await co.showCairoImageAbsolute(surface, pos.x, pos.y, settings.widget_stream_width, settings.widget_stream_height);

    co.cairo('cairo_surface_destroy', surface);
    co.cairo('cairo_destroy', cairo);
}

async function generateQrCode(text: string, size: number) {
    return new Promise<Buffer>((resolve) => {
        const chunks: Buffer[] = [];
        const memStream = new MemoryStream();
        memStream.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });
        memStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });

        QRCode.toFileStream(memStream, text, {
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
            width: size,
        });
    });
}

async function uploadFont() {
    if (co) {
        const imgData = fs.readFileSync('fre3of9x.ttf');
        const fontRes = await co.uploadFontData(imgData);
        barcodeFont = fontRes.var;
    }
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

async function sendAcsEvent(text: string) {
    try {
        if (!acsConfigured) {
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
                externalDataType: 'qrBarCodeReader',
                data: {
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text,
                },
            },
        };
        const eventData = JSON.stringify(event);
        await sendRequest(
            {
                protocol: settings.acs_protocol === 'http' ? 'http:' : 'https:',
                method: 'POST',
                host: settings.acs_ip,
                port: settings.acs_port ?? 29204,
                path: '/Acs/Api/ExternalDataFacade/AddExternalData',
                user: settings.acs_user,
                pass: settings.acs_pass,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': eventData.length.toString(),
                },
                rejectUnauthorized: settings.acs_protocol !== 'https_insecure',
            },
            eventData
        );
    } catch (err) {
        console.error('Send ACS event: ', err instanceof Error ? err.message : 'Unknown Error');
    }
}

function pad(num: number, size: number) {
    const sign = Math.sign(num) === -1 ? '-' : '';
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
    cleanExit();
});

process.on('SIGTERM', async () => {
    console.log('App exit');
    cleanExit();
});

async function cleanExit() {
    try {
        if (co && coConnected) {
            await co.removeImage();
        }
    } catch (err) {
        console.error('Hide graphics: ', err);
    } finally {
        process.exit();
    }
}

console.log('App started');
if (coConfigured || acsConfigured) {
    start();
} else {
    console.log('Application is not configured');
    process.exit(1);
}
