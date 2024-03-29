import * as fs from 'fs';
import { httpRequest, HttpRequestOptions } from 'camstreamerlib/HttpRequest';
import { CameraVapix, CameraVapixOptions } from 'camstreamerlib/CameraVapix';
import { CamOverlayAPI, CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';

type Camera = {
    IP: string;
    protocol: string;
    port: number;
    user: string;
    password: string;
};

type Settings = {
    sourceCamera: Camera;
    targetCamera: Camera;
    serviceID: number;
    lpFieldName: string;
    tsFieldName: string;
    timeFormat: string;
    dateFormat: string;
    visibilityTime: number;
};

type Format = {
    date: string;
    time: string;
};

let settings: Settings;

function format_12(hour: number, minute: number, second: number) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;

    if (hour == 0) {
        hour = 12;
    }

    const strMinute = minute < 10 ? '0' + minute : minute;
    const strSecond = second < 10 ? '0' + second : second;
    return `${hour}:${strMinute}:${strSecond} ${ampm}`;
}

function format_24(hour: number, minute: number, second: number) {
    const strMinute = minute < 10 ? '0' + minute : minute;
    const strSecond = second < 10 ? '0' + second : second;
    return `${hour}:${strMinute}:${strSecond}`;
}

function dateFromTimestamp(timestamp: number, format: Format) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    let time: string;
    if (format.time === '12') {
        time = format_12(hour, minute, second);
    } else {
        time = format_24(hour, minute, second);
    }

    if (format.date === 'DD/MM/YYYY') {
        return `${time} ${day}/${month + 1}/${year}`;
    } else if (format.date === 'MM/DD/YYYY') {
        return `${time} ${month + 1}/${day}/${year}`;
    } else {
        return 'Unknown format';
    }
}

async function sendEnabledRequest(enabledParameter: number) {
    const options: HttpRequestOptions = {
        host: settings.targetCamera.IP,
        port: settings.targetCamera.port,
        path: `/local/camoverlay/api/enabled.cgi?id_${settings.serviceID}=${enabledParameter}`,
        auth: settings.targetCamera.user + ':' + settings.targetCamera.password,
        method: 'GET',
        protocol: settings.targetCamera.protocol === 'http' ? 'http:' : 'https:',
        rejectUnauthorized: settings.targetCamera.protocol === 'https',
    };

    try {
        await httpRequest(options, '', true);
    } catch (error) {
        console.error(error);
    }
}

let isCamOverlayVisible = false;
function hideCamOverlay() {
    isCamOverlayVisible = false;
    sendEnabledRequest(0);
}

function showCamOverlay() {
    isCamOverlayVisible = true;
    sendEnabledRequest(1);
}

let timeoutID;
async function displayInCamOverlay(data: { timestamp: number; licensePlate: string }) {
    try {
        const options: CamOverlayOptions = {
            ip: settings.targetCamera.IP,
            port: settings.targetCamera.port,
            auth: settings.targetCamera.user + ':' + settings.targetCamera.password,
            tls: settings.targetCamera.protocol !== 'http',
            tlsInsecure: settings.targetCamera.protocol === 'https_insecure',
        };
        const co = new CamOverlayAPI(options);

        const format = {
            time: settings.timeFormat,
            date: settings.dateFormat,
        };
        const date = dateFromTimestamp(data.timestamp, format);

        let coLicensePlate = settings.lpFieldName;
        let coTimeStamp = settings.tsFieldName;

        const fields = [];

        if (coLicensePlate.length !== 0) {
            let field = {
                field_name: coLicensePlate,
                text: data.licensePlate,
            };
            fields.push(field);
        }
        if (coTimeStamp.length !== 0) {
            let field = {
                field_name: coTimeStamp,
                text: date,
            };
            fields.push(field);
        }

        if (!isCamOverlayVisible) {
            showCamOverlay();
        }
        await co.updateCGText(settings.serviceID, fields);
        clearTimeout(timeoutID);

        if (settings.visibilityTime > 0) {
            timeoutID = setTimeout(() => {
                hideCamOverlay();
            }, 1000 * settings.visibilityTime);
        }
    } catch (error) {
        console.error('Camoverlay error: ', error);
    }
}

function onMessage(data) {
    const outputData = {
        timestamp: data.timestamp as number,
        licensePlate: data.message.data.text as string,
    };
    displayInCamOverlay(outputData);
}

function startCameraVapixLibraryWebsocket() {
    const options: CameraVapixOptions = {
        ip: settings.sourceCamera.IP,
        port: settings.sourceCamera.port,
        auth: `${settings.sourceCamera.user}:${settings.sourceCamera.password}`,
        tls: settings.sourceCamera.protocol !== 'http',
        tlsInsecure: settings.sourceCamera.protocol === 'https_insecure',
    };

    const cv = new CameraVapix(options);

    cv.on('eventsConnect', () => {
        console.log('Websocket connected.');
    });
    cv.on('eventsDisconnect', (error) => {
        if (error === undefined) {
            console.log('Websocket disconnected.');
            process.exit(1);
        } else {
            console.error('Websocket error: ', error);
            process.exit(1);
        }
    });
    cv.on('eventsClose', () => {
        console.log('Websocket disconnected.');
        process.exit(1);
    });

    cv.on('tnsaxis:CameraApplicationPlatform/ALPV.AllPlates', (data) => {
        onMessage(data.params.notification);
    });

    cv.eventsConnect();
}

function main() {
    try {
        const path = process.env.PERSISTENT_DATA_PATH;
        const data: any = fs.readFileSync(path + 'settings.json');
        settings = JSON.parse(data);
    } catch (error) {
        console.error('Error with Settings file: ', error);
        return;
    }
    startCameraVapixLibraryWebsocket();
}

process.on('uncaughtException', function (error) {
    console.error('uncaughtException: ', error);
    process.exit(1);
});

process.on('unhandledRejection', function (error) {
    console.error('unhandledRejection: ', error);
    process.exit(1);
});

main();
