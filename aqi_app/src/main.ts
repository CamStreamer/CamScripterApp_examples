import * as fs from 'fs/promises';
import * as url from 'url';

import { https } from 'follow-redirects';
import { PainterOptions, Painter, Frame, CamOverlayDrawingOptions } from 'camstreamerlib/CamOverlayPainter/Painter';

type ImageCode = {
    text: string[];
    img_file: string;
    color: [number, number, number];
};
type AqiResponseType = {
    data: {
        aqi: number;
    };
};

let settings: {
    camera_protocol: string;
    camera_user: string;
    camera_pass: string;
    camera_ip: string;
    camera_port: number;
    scale: number;
    coordinates: string;
    access_token: string;
    display_location: string;
    location: string;
    update_frequency: number;
    pos_x: number;
    pos_y: number;
    resolution: string;

    serviceName: string;
    font: string;
    translation: Record<string, string>;
};

let cam_width: number;
let cam_height: number;

let background: Painter;
let value: Frame;
let label: Frame;
let text: Frame;
let upperText: Frame;
let lowerText: Frame;

const fontColor: [number, number, number] = [1.0, 1.0, 1.0];

const codes: Record<string, ImageCode> = {
    good: {
        text: ['GOOD'],
        img_file: 'Good.png',
        color: [0, 153 / 255, 76 / 255],
    },
    moderate: {
        text: ['MODERATE'],
        img_file: 'Moderate.png',
        color: [1.0, 1.0, 51 / 255],
    },
    sensitive: {
        text: ['UNHEALTHY FOR', 'SENSITIVE GROUPS'],
        img_file: 'sensitive_groups.png',
        color: [1.0, 128 / 255, 0],
    },
    unhealthy: {
        text: ['UNHEALTHY'],
        img_file: 'Unhealthy.png',
        color: [1.0, 51 / 255, 51 / 255],
    },
    very_unhealthy: {
        text: ['VERY UNHEALTHY'],
        img_file: 'Very_Unhealthy.png',
        color: [102 / 255, 0, 204 / 255],
    },
    hazardous: {
        text: ['HAZARDOUS'],
        img_file: 'Hazardous.png',
        color: [153 / 255, 0, 0],
    },
    error: {
        text: ['ERROR'],
        img_file: 'Error.png',
        color: [0, 0, 0],
    },
};

function split(text: string): string[] {
    if (text.length <= 19) {
        return [text];
    }

    const half = text.length / 2;
    let middle_space = -1;
    for (let f = 0; f < text.length; f += 1) {
        if (text[f] === ' ') {
            if (Math.abs(half - f) < Math.abs(half - middle_space)) {
                middle_space = f;
            } else {
                break;
            }
        }
    }
    if (middle_space === -1) {
        return [text];
    } else {
        return [text.substring(0, middle_space), text.substring(middle_space + 1)];
    }
}

function setCodeText() {
    settings.translation ??= {};
    for (const c in codes) {
        if (settings.translation[c] !== undefined && settings.translation[c] !== '') {
            codes[c].text = split(settings.translation[c]);
        }
    }
}

function registerResources(background: Painter) {
    for (const c in codes) {
        background.registerImage(codes[c].img_file, `${settings.serviceName}/${codes[c].img_file}`);
    }

    background.registerFont('OpenSans', 'OpenSans-Regular.ttf');
    background.registerFont('ComicSans', 'ComicSans.ttf');
    background.registerFont('GenShinGothic', 'GenShinGothic-Medium.ttf');
}

function sendRequest(send_url: string, auth: string) {
    return new Promise<string>((resolve, reject) => {
        const parsedUrl = url.parse(send_url);
        const options = {
            method: 'GET',
            host: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.path,
            headers: { Authorization: auth },
            timeout: 5000, // 5s
        };
        const req = https.request(options, (res) => {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error('Server returned status code: ' + res.statusCode + ', message: ' + data));
                } else {
                    resolve(data);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

function mapData(data: AqiResponseType) {
    let displayedValue: number | undefined;
    try {
        displayedValue = data.data.aqi;
    } catch (err) {
        displayedValue = undefined;
    }

    let code: ImageCode;
    if (displayedValue === undefined) {
        code = codes['error'];
    } else if (displayedValue <= 50) {
        code = codes['good'];
    } else if (displayedValue <= 100) {
        code = codes['moderate'];
    } else if (displayedValue <= 150) {
        code = codes['sensitive'];
    } else if (displayedValue <= 200) {
        code = codes['unhealthy'];
    } else if (displayedValue <= 300) {
        code = codes['very_unhealthy'];
    } else if (displayedValue > 300) {
        code = codes['hazardous'];
    } else {
        code = codes['error'];
    }

    if (code.text.length === 1) {
        upperText.disable();
        lowerText.disable();
        text.enable();

        text.setText(code.text[0], 'A_CENTER', 'TFM_SCALE');
    } else {
        upperText.enable();
        lowerText.enable();
        text.disable();

        upperText.setText(code.text[0], 'A_CENTER', 'TFM_SCALE');
        lowerText.setText(code.text[1], 'A_CENTER', 'TFM_SCALE');
    }

    value.setText(displayedValue?.toString() ?? '', 'A_CENTER', 'TFM_SCALE');
    label.setText(settings.display_location, 'A_CENTER', 'TFM_SCALE');
    background.setBgImage(code.img_file, 'fit');
}

function genLayout(background: Painter) {
    label = new Frame({
        x: 0,
        y: 10,
        height: 30,
        width: 272,
        text: '',
        fontColor: fontColor,
    });
    value = new Frame({
        x: 0,
        y: 38,
        height: 90,
        width: 272,
        text: '',
        fontColor: fontColor,
    });
    text = new Frame({
        x: 3,
        y: 142,
        height: 30,
        width: 272,
        text: '',
        fontColor: fontColor,
    });
    upperText = new Frame({
        x: 3,
        y: 130,
        height: 25,
        width: 272,
        text: '',
        fontColor: fontColor,
        enabled: false,
    });
    lowerText = new Frame({
        x: 3,
        y: 160,
        height: 25,
        width: 272,
        text: '',
        fontColor: fontColor,
        enabled: false,
    });

    background.insert(value);
    background.insert(label);
    background.insert(text);
    background.insert(upperText);
    background.insert(lowerText);
    value.setFont(settings.font);
    label.setFont(settings.font);
    text.setFont(settings.font);
    upperText.setFont(settings.font);
    lowerText.setFont(settings.font);
}

async function requestAQI(location: string, acc_token: string) {
    try {
        const api_url = 'https://api.waqi.info/feed/' + location + '/?token=' + acc_token;
        const data = await sendRequest(api_url, '');
        return JSON.parse(data);
    } catch (error) {
        console.error('Cannot get data from AQI');
        console.error(error);
    }
}

async function oneAppPeriod() {
    try {
        const data = await requestAQI(settings.location, settings.access_token);
        mapData(data);
        await background.display(settings.scale / 100);
    } catch (error) {
        console.error(error);
    }

    setTimeout(oneAppPeriod, 5000);
}

async function main() {
    try {
        const data = await fs.readFile(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        settings = JSON.parse(data.toString());
        setCodeText();
        const resolution = settings.resolution.split('x');
        cam_width = parseInt(resolution[0]);
        cam_height = parseInt(resolution[1]);
    } catch (err) {
        console.error('No settings file found');
        return;
    }

    const options: PainterOptions = {
        x: settings.pos_x,
        y: settings.pos_y,
        width: 280,
        height: 278,
        screenWidth: cam_width,
        screenHeight: cam_height,
        coAlignment: settings.coordinates,
    };
    const coOptions: CamOverlayDrawingOptions = {
        ip: settings.camera_ip,
        port: settings.camera_port,
        user: settings.camera_user,
        pass: settings.camera_pass,
        tls: settings.camera_protocol !== 'http',
        tlsInsecure: settings.camera_protocol === 'https_insecure',
    };
    background = new Painter(options, coOptions);
    registerResources(background);

    try {
        await background.connect();
        genLayout(background);
        await oneAppPeriod();
    } catch {
        console.error('COAPI-Error: connection error');
        process.exit(1);
    }
}

void main();

process.on('unhandledRejection', (error: Error) => {
    console.error('unhandledRejection', error);
    process.exit(1);
});
process.on('uncaughtException', (error: Error) => {
    console.error('uncaughtException', error);
    process.exit(1);
});
