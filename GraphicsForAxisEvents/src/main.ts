import * as fs from 'fs';
import { CameraVapix } from 'camstreamerlib/CameraVapix';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';

type Camera = {
    IP: string;
    port: number;
    user: string;
    password: string;
};

type Settings = {
    sourceCamera: Camera;
    targetCamera: Camera;
    modem: Camera;
    events: {
        eventName: string;
        serviceID: number;
        duration: string;
        stateName: string;
        invert: boolean;
    }[];
};

type Event = {
    eventName: string;
    duration: number;
    co: CamOverlayAPI;
    lastTimeout: NodeJS.Timeout;
};

async function setEnabledIfNecessary(co: CamOverlayAPI, enabled: boolean) {
    if ((await co.isEnabled()) !== enabled) {
        co.setEnabled(enabled);
    }
}

function onStatelessEvent(event: Event) {
    setEnabledIfNecessary(event.co, true);
    if (event.duration >= 1) {
        if (event.lastTimeout !== null) {
            clearTimeout(event.lastTimeout);
        }
        event.lastTimeout = setTimeout(() => {
            setEnabledIfNecessary(event.co, false);
            event.lastTimeout = null;
        }, event.duration);
    }
}

function onStatefulEvent(event: Event, state: boolean, invert: boolean) {
    if (event.duration >= 1) {
        if (state !== invert) {
            setEnabledIfNecessary(event.co, true);
            if (event.lastTimeout !== null) {
                clearTimeout(event.lastTimeout);
            }
            event.lastTimeout = setTimeout(() => {
                setEnabledIfNecessary(event.co, false);
                event.lastTimeout = null;
            }, event.duration);
        }
    } else {
        setEnabledIfNecessary(event.co, state !== invert);
    }
}

function getSettings() {
    try {
        const path = process.env.PERSISTENT_DATA_PATH;
        const data = fs.readFileSync(path + 'settings.json');
        return JSON.parse(data.toString());
    } catch (error) {
        console.log('Error with Settings file: ', error);
        process.exit(1);
    }
}

async function prepareCamOverlay(settings: Settings) {
    const cos: Record<number, CamOverlayAPI> = {};
    for (let event of settings.events) {
        const options = {
            ip: settings.targetCamera.IP,
            port: settings.targetCamera.port,
            auth: `${settings.targetCamera.user}:${settings.targetCamera.password}`,
            serviceID: event.serviceID,
        };
        try {
            const co = new CamOverlayAPI(options);
            await co.connect();
            await co.setEnabled(false);
            cos[event.serviceID] = co;
        } catch (error) {
            console.log(`Cannot connect to CamOverlay service with ID ${event.serviceID} (${error})`);
            process.exit(1);
        }
    }
    return cos;
}

function isStateful(eventData, stateName: string) {
    return eventData[stateName] !== undefined;
}

async function subscribeEventMessages(settings: Settings, cos: Record<number, CamOverlayAPI>) {
    const options = {
        protocol: 'http',
        ip: settings.targetCamera.IP,
        port: settings.targetCamera.port,
        auth: `${settings.targetCamera.user}:${settings.targetCamera.password}`,
    };

    const cv = new CameraVapix(options);
    cv.on('eventsDisconnect', (error) => {
        if (error == undefined) {
            console.log('Websocket disconnected.');
        } else {
            console.log('Websocket error: ', error);
        }
        process.exit(1);
    });

    for (let event of settings.events) {
        const time = event.duration.split(':');
        const hours = Number.parseInt(time[0]);
        const minutes = Number.parseInt(time[1]);
        const seconds = Number.parseInt(time[2]);

        let duration = (3600 * hours + 60 * minutes + seconds) * 1000;
        if (Number.isNaN(duration)) {
            duration = 0;
        }

        cv.on(event.eventName, (data) => {
            const eventData = data.params.notification.message.data;
            const e = {
                eventName: event.eventName,
                duration: duration,
                co: cos[event.serviceID],
                lastTimeout: null,
            };
            if (isStateful(eventData, event.stateName)) {
                onStatefulEvent(e, eventData[event.stateName] === '1', event.invert);
            } else {
                onStatelessEvent(e);
            }
        });
    }
    cv.eventsConnect('websocket');
}

async function main() {
    const settings = getSettings();
    const cos = await prepareCamOverlay(settings);
    subscribeEventMessages(settings, cos);
}

process.on('unhandledRejection', (reason) => {
    console.log(reason);
    process.exit(1);
});

main();
