const fs = require('fs');
const net = require('net');
const https = require('https');
const { CamOverlayAPI } = require('camstreamerlib/CamOverlayAPI');
const { CamScripterAPICameraEventsGenerator } = require('camstreamerlib/CamScripterAPICameraEventsGenerator');

let prevWeightData = null;
let dataBuffer = '';

let camOverlay = null;
let csc = null;

// Read script configuration
let settings = null;
try {
    const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    settings = JSON.parse(data);
} catch (err) {
    console.log('No settings file found');
    process.exit(1);
}

// CamOverlay integration
const coEnabled = settings.camera.ip && settings.camera.service_id;
if (coEnabled) {
    camOverlay = new CamOverlayAPI({
        tls: settings.camera.protocol !== 'http',
        tlsInsecure: settings.camera.protocol === 'https_insecure',
        ip: settings.camera.ip,
        port: settings.camera.port,
        user: settings.camera.user,
        pass: settings.camera.pass,
    });
}

// Camera Events integration
const eventsConfigured =
    settings.event_camera.ip.length !== 0 &&
    settings.event_camera.user.length !== 0 &&
    settings.event_camera.pass.length !== 0 &&
    settings.event_camera.condition_delay != null &&
    settings.event_camera.condition_operator != null &&
    settings.event_camera.condition_value != null;

if (eventsConfigured) {
    csc = new CamScripterAPICameraEventsGenerator({
        tls: settings.event_camera.protocol !== 'http',
        tlsInsecure: settings.event_camera.protocol === 'https_insecure',
        ip: settings.event_camera.ip,
        port: settings.event_camera.port,
        user: settings.event_camera.user,
        pass: settings.event_camera.pass,
    });
}

// Axis Camera Station integration
const acsEnabled = settings.acs.ip.length;

// Connect to electronic scale
let scaleClient = new net.Socket();
scaleClient.connect(settings.scale.port, settings.scale.ip);

scaleClient.on('connect', (data) => {
    console.log('Scale connected');
    setInterval(() => {
        scaleClient.write(Buffer.from('1B700D0A', 'hex'));
    }, settings.scale.refresh_rate);
});

scaleClient.on('data', async (data) => {
    dataBuffer += Buffer.from(data, 'hex').toString();
    const messageEnd = dataBuffer.indexOf('\r\n');
    if (messageEnd == -1) {
        return;
    }
    const weightData = dataBuffer.substring(0, messageEnd);
    dataBuffer = '';

    if (prevWeightData != weightData) {
        prevWeightData = weightData;

        //Parse weight and unit
        const weight = weightData.substring(0, 9).trim();
        const unit = weightData.substring(9).trim();

        // Show image in CamOverlay service
        if (coEnabled) {
            try {
                await camOverlay.updateCGText(settings.camera.service_id, [
                    {
                        field_name: settings.camera.value_field_name,
                        text: weight,
                    },
                    {
                        field_name: settings.camera.unit_field_name,
                        text: unit,
                    },
                ]);
            } catch (err) {
                console.error('CamOverlay error:', err);
            }
        }

        // Send Camera Event
        if (eventsConfigured && unit.length) {
            checkCondtionAndSendCameraEvent(weight);
        }

        // Send to Axis Camera Station. Unit is not empty when the weight is stable.
        if (acsEnabled && weight != 0 && unit.length) {
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
                    source: settings.acs.source_key,
                    externalDataType: 'LantronixScale',
                    data: {
                        timestamp: (Date.now() / 1000).toString(),
                        weight: weight,
                        unit,
                    },
                },
            };
            const eventData = JSON.stringify(event);
            const req = https.request({
                method: 'POST',
                host: settings.acs.ip,
                port: settings.acs.port,
                path: '/Acs/Api/ExternalDataFacade/AddExternalData',
                auth: settings.acs.user + ':' + settings.acs.pass,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': eventData.length,
                },
                rejectUnauthorized: false,
            });
            req.on('error', (err) => {
                console.error('ACS error:', err);
            });
            req.write(eventData);
            req.end();
        }
    }
});

scaleClient.on('error', (err) => {
    console.error('Scale connection error:', err);
    process.exit(1);
});

scaleClient.on('close', () => {
    console.log('Scale connection closed');
    process.exit(0);
});

let cscConnected = false;
let cscEventDeclared = false;
let cscEventConditionTimer = null;
let sentActiveState = false;

function isConditionActive(weight, operator, conditionValue) {
    switch (operator) {
        case 0:
            return weight === conditionValue;
        case 1:
            return weight > conditionValue;
        case 2:
            return weight < conditionValue;
        case 3:
            return weight >= conditionValue;
        case 4:
            return weight <= conditionValue;
    }
}

async function connectCameraEvents() {
    if (!cscConnected) {
        csc.removeAllListeners();
        csc.on('open', () => {
            console.log('CSc: connected');
            cscConnected = true;
        });

        csc.on('error', (err) => {
            console.log('CSc-Error: ' + err);
        });

        csc.on('close', () => {
            console.log('CSc-Error: connection closed');
            cscConnected = false;
            cscEventDeclared = false;
            sentActiveState = false;
        });

        await csc.connect();
    }
    return cscConnected;
}

function declareCameraEvent() {
    return csc.declareEvent({
        declaration_id: 'LantronixScaleReader',
        stateless: false,
        declaration: [
            {
                namespace: 'tnsaxis',
                key: 'topic0',
                value: 'CameraApplicationPlatform',
                value_type: 'STRING',
            },
            {
                namespace: 'tnsaxis',
                key: 'topic1',
                value: 'CamScripter',
                value_type: 'STRING',
            },
            {
                namespace: 'tnsaxis',
                key: 'topic2',
                value: 'LantronixScaleReader',
                value_type: 'STRING',
                value_nice_name: 'CamScripter: CameraApplicationPlatform',
            },
            {
                type: 'DATA',
                namespace: '',
                key: 'condition_active',
                value: false,
                value_type: 'BOOL',
                key_nice_name: 'React on active condition (settings in the script)',
                value_nice_name: 'Condition is active',
            },
        ],
    });
}

async function sendCameraEventTimerCallback(conditionActive) {
    try {
        console.error(`Camera events: condition active: ${conditionActive}`);
        await sendCameraEvent(conditionActive);
        sentActiveState = conditionActive;
        cscEventConditionTimer = null;
    } catch (err) {
        console.error('Camera events error:', err);
        cscEventConditionTimer = setTimeout(() => sendCameraEventTimerCallback(conditionActive), 5000);
    }
}

function sendCameraEvent(active) {
    return csc.sendEvent({
        declaration_id: 'LantronixScaleReader',
        event_data: [
            {
                namespace: '',
                key: 'condition_active',
                value: active,
                value_type: 'BOOL',
            },
        ],
    });
}

async function checkCondtionAndSendCameraEvent(weight) {
    try {
        const conditionActive = isConditionActive(
            Number.parseInt(weight),
            Number.parseInt(settings.event_camera._condition_operator),
            Number.parseInt(settings.event_camera.condition_value)
        );

        if (!(await connectCameraEvents())) {
            return;
        }

        if (!cscEventDeclared) {
            await declareCameraEvent();
            cscEventDeclared = true;
        }

        if (conditionActive != sentActiveState && (!cscEventConditionTimer || !conditionActive)) {
            const timerTime = conditionActive ? settings.event_camera.condition_delay * 1000 : 0;
            clearTimeout(cscEventConditionTimer);
            cscEventConditionTimer = setTimeout(() => sendCameraEventTimerCallback(conditionActive), timerTime);
        }
    } catch (err) {
        console.error('Camera events error:', err);
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
