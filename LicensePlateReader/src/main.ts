const fs = require('fs');
const http = require('http');
const CameraVapix = require('camstreamerlib/CameraVapix');
const CamOverlayAPI = require('camstreamerlib/CamOverlayAPI');

type Camera = {
    IP: string;
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
    timeFormat: number;
    dateFormat: string;
    visibilityTime: number;
};

type Format = {
    date: string;
    time: number;
};

let settings: Settings;

function format_12(hour: number, minute: number, second: number) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;

    if (hour == 0) {
        hour = 12;
    }

    const str_minute = minute < 10 ? '0' + minute : minute;
    const str_second = second < 10 ? '0' + second : second;
    return `${hour}:${str_minute}:${str_second} ${ampm}`;
}

function format_24(hour: number, minute: number, second: number) {
    const str_minute = minute < 10 ? '0' + minute : minute;
    const str_second = second < 10 ? '0' + second : second;
    return `${hour}:${str_minute}:${str_second}`;
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
    if (format.time === 12) {
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

function sendEnabledRequest(enabledParameter: number) {
    const options = {
        hostname: settings.targetCamera.IP,
        port: settings.targetCamera.port,
        path: `/local/camoverlay/api/enabled.cgi?id_${settings.serviceID}=${enabledParameter}`,
        auth: settings.targetCamera.user + ':' + settings.targetCamera.password,
        method: 'GET',
    };

    const req = http.request(options);
    req.on('error', function (error) {
        console.log(`Error with HTTP (${options.path}): `, error);
    });
    req.end();
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
async function displayInCamOverlay(data) {
    try {
        const options = {
            ip: settings.targetCamera.IP,
            port: settings.targetCamera.port,
            auth: settings.targetCamera.user + ':' + settings.targetCamera.password,
            serviceID: settings.serviceID,
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
        await co.updateCGText(fields);
        clearTimeout(timeoutID);

        if (settings.visibilityTime > 0) {
            timeoutID = setTimeout(() => {
                hideCamOverlay();
            }, 1000 * settings.visibilityTime);
        }
    } catch (error) {
        console.log('Camoverlay error: ', error);
    }
}

function onMessage(data) {
    const outputData = {
        timestamp: data.timestamp,
        licensePlate: data.message.data.text,
    };
    displayInCamOverlay(outputData);
}

function startCameraVapixLibraryWebsocket() {
    const options = {
        ip: settings.sourceCamera.IP,
        port: settings.sourceCamera.port,
        auth: `${settings.sourceCamera.user}:${settings.sourceCamera.password}`,
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
            console.log('Websocket error: ', error);
            process.exit(1);
        }
    });

    cv.on('tnsaxis:CameraApplicationPlatform/ALPV.AllPlates', (data) => {
        onMessage(data.params.notification);
    });

    cv.eventsConnect('websocket');
}

function main() {
    try {
        const path = process.env.PERSISTENT_DATA_PATH;
        const data = fs.readFileSync(path + 'settings.json');
        settings = JSON.parse(data);
    } catch (error) {
        console.log('Error with Settings file: ', error);
        return;
    }
    startCameraVapixLibraryWebsocket();
}

process.on('unhandledRejection', function (error) {
    console.log('unhandledRejection: ', error);
    process.exit(1);
});

main();
