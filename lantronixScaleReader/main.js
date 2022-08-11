const fs = require('fs');
const net = require('net');
const https = require('https');
const { CameraVapix } = require('camstreamerlib/CameraVapix');

let prevWeightData = null;
let dataBuffer = '';

let cameraVapix = null;
let milestoneClient = null;
let milestoneConnected = false;
let milestoneProtectionPeriod = false;

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
const coEnabled = settings.camera_ip && settings.service_id;
if (coEnabled) {
    cameraVapix = new CameraVapix({
        protocol: 'http',
        ip: settings.camera_ip,
        port: settings.camera_port,
        auth: settings.camera_user + ':' + settings.camera_pass,
    });
}

// Axis Camera Station integration
const acsEnabled = settings.acs_ip.length;

// Milestone integration
const milestoneEnabled = settings.milestone_ip.length;

// Connect to electronic scale
let scaleClient = new net.Socket();
scaleClient.connect(settings.scale_port, settings.scale_ip);

scaleClient.on('connect', (data) => {
    console.log('Scale connected');
    setInterval(() => {
        scaleClient.write(Buffer.from('1B700D0A', 'hex'));
    }, settings.refresh_rate);
});

scaleClient.on('data', (data) => {
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
            cameraVapix
                .vapixGet(
                    '/local/camoverlay/api/customGraphics.cgi?' +
                    `service_id=${settings.service_id}&` +
                    `${settings.value_field_name}=${weight}&` +
                    `${settings.unit_field_name}=${unit}`
                )
                .then(
                    (response) => {
                        //console.log(response);
                    },
                    function (err) {
                        console.error('CamOverlay error:', err);
                    }
                );
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
                    source: settings.acs_source_key,
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
                host: settings.acs_ip,
                port: 55756,
                path: '/Acs/Api/ExternalDataFacade/AddExternalData',
                auth: settings.acs_user + ':' + settings.acs_pass,
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

        // Send to Milestone.
        if (milestoneEnabled) {
            connectMilestone();

            // Unit is not empty when the weight is stable.
            if (milestoneConnected && !milestoneProtectionPeriod && weight != 0 && unit.length) {
                const sep = Buffer.from(settings.milestone_separator);
                milestoneClient.write(Buffer.from(settings.milestone_string, 'ascii') + sep);
                milestoneProtectionPeriod = true;
                setTimeout(() => {
                    milestoneProtectionPeriod = false;
                }, settings.milestone_minimum_span * 1000);
            }
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

function connectMilestone() {
    if (milestoneClient !== null) {
        return;
    }

    milestoneClient = new net.Socket();
    milestoneClient.connect(settings.milestone_port, settings.milestone_ip);
    milestoneClient.on('connect', () => {
        milestoneConnected = true;
    });
    milestoneClient.on('error', (err) => {
        console.log('Milestone connection error:', err);
        milestoneClient = null;
        milestoneConnected = false;
    });
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
