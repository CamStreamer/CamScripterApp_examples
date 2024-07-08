import * as fs from 'fs/promises';
import * as url from 'url';

import { https, FollowResponse } from 'follow-redirects';
import { Options, Painter, Frame, ResourceManager } from 'camstreamerlib/CamOverlayPainter/Painter';

type ImageCode = {
    text: string;
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

    font: string;
    translation: Record<string, string>;
};

let cam_width: number;
let cam_height: number;

let background: Painter;
let value: Frame;
let label: Frame;
let text: Frame;

const codes: Record<string, ImageCode> = {
    good: {
        text: 'Good',
        img_file: 'Good.png',
        color: [0, 153 / 255, 76 / 255],
    },
    moderate: {
        text: 'Moderate',
        img_file: 'Moderate.png',
        color: [1.0, 1.0, 51 / 255],
    },
    sensitive: {
        text: 'Unhealthy SG',
        img_file: 'sensitive_groups.png',
        color: [1.0, 128 / 255, 0],
    },
    unhealthy: {
        text: 'Unhealthy',
        img_file: 'Unhealthy.png',
        color: [1.0, 51 / 255, 51 / 255],
    },
    very_unhealthy: {
        text: 'Very Unhealthy',
        img_file: 'Very_Unhealthy.png',
        color: [102 / 255, 0, 204 / 255],
    },
    hazardous: {
        text: 'Hazardous',
        img_file: 'Hazardous.png',
        color: [153 / 255, 0, 0],
    },
    error: {
        text: 'Error',
        img_file: 'Error.png',
        color: [0, 0, 0],
    },
};

function setCodeText() {
    for (const c in codes) {
        if (settings.translation && settings.translation[c]) {
            codes[c].text = settings.translation[c];
        }
    }
}

function registerResources() {
    const rm = new ResourceManager();
    for (const c in codes) {
        rm.registerImage(codes[c].img_file, codes[c].img_file);
    }

    rm.registerFont('OpenSans', 'OpenSans-Regular.ttf');
    rm.registerFont('ComicSans', 'ComicSans.ttf');
    rm.registerFont('GenShinGothic', 'GenShinGothic-Medium.ttf');

    return rm;
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

    value.setText(displayedValue?.toString() ?? '', 'A_CENTER');
    label.setText(settings.display_location, 'A_CENTER');
    text.setText(code.text, 'A_CENTER');
    background.setBgImage(code.img_file, 'fit');
}

function genLayout(background: Painter, rm: ResourceManager) {
    label = new Frame(
        {
            x: 0,
            y: 10,
            height: 30,
            width: 279,
            text: '',
            fontColor: [1.0, 1.0, 1.0],
        },
        rm
    );
    value = new Frame(
        {
            x: 0,
            y: 35,
            height: 100,
            width: 279,
            text: '0',
            fontColor: [1.0, 1.0, 1.0],
        },
        rm
    );
    text = new Frame(
        {
            x: 0,
            y: 150,
            height: 30,
            width: 279,
            text: '',
            fontColor: [1.0, 1.0, 1.0],
        },
        rm
    );
    background.insert(value);
    background.insert(label);
    background.insert(text);
    value.setFont(settings.font);
    label.setFont(settings.font);
    text.setFont(settings.font);
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

    const options: Options = {
        x: settings.pos_x,
        y: settings.pos_y,
        width: 279,
        height: 253,
        screenWidth: cam_width,
        screenHeight: cam_height,
        coAlignment: settings.coordinates,
    };
    const coOptions = {
        ip: settings.camera_ip,
        port: settings.camera_port,
        auth: settings.camera_user + ':' + settings.camera_pass,
        tls: settings.camera_protocol !== 'http',
        tlsInsecure: settings.camera_protocol === 'https_insecure',
    };
    const rm = registerResources();
    background = new Painter(options, coOptions, rm);

    try {
        await background.connect();
        genLayout(background, rm);
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
