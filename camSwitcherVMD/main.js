const fs = require('fs');
const { HttpServer } = require('camstreamerlib/HttpServer');
const { CameraVapix } = require('camstreamerlib/CameraVapix');
const { CamSwitcher } = require('camstreamerlib/CamSwitcherAPI');

let settingsJson = null;
let cameraVapix = [];
let vmdActive = [false, false];
let csw = null;
let selectedCameraIndex = null;
let selectedCameraTime = null;
let switchTimer = null;

let httpServer = new HttpServer();
httpServer.onRequest('/check_vmd.cgi', processRequestCheckVmd);
httpServer.on('error', function (err) {
    console.log(err);
});
httpServer.on('access', function (msg) {
    console.log(msg);
});

function processRequestCheckVmd(req, res) {
    let counter = 0;
    let vmdInstalled = true;
    for (let i = 0; i < cameraVapix.length; i++) {
        cameraVapix[i].getApplicationList().then((appList) => {
            counter++;
            let installed = false;
            for (let j = 0; j < appList.length; j++) {
                if (appList[j].Name == 'vmd') {
                    installed = true;
                    break;
                }
            }
            vmdInstalled &= installed;
            if (counter == cameraVapix.length) {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(vmdInstalled ? '{"state": "OK"}' : '{"state": "NOT INSTALLED"}');
            }
        }, (err) => {
            console.error(err);
            res.statusCode = 200;
            res.setHeader('Content-type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end('{"state": "Cannot get camera application list"}');
        });
    }
}

async function start() {
    try {
        let data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        settingsJson = JSON.parse(data);
        for (let i = 0; i < settingsJson.cameraList.length; i++) {
            subscribeEvents(i, settingsJson.cameraList[i]);
        }

        let switcherCamera = settingsJson.cameraList[0];
        csw = new CamSwitcher({
            'ip': switcherCamera.ip,
            'port': 80,
            'auth': switcherCamera.user + ':' + switcherCamera.pass,
        });

        // Find playlists names from nice names
        let playlists = await csw.getPlaylistList();
        for (let i = 0; i < settingsJson.cameraList.length; i++) {

            let found = false;
            for (let playlistName in playlists) {

                if (settingsJson.cameraList[i].playlistNiceName != undefined
                    && (settingsJson.cameraList[i].playlistNiceName == playlists[playlistName].niceName
                        || settingsJson.cameraList[i].playlistNiceName == playlists[playlistName].name)) {  // Backward compatibility

                    found = true;
                    settingsJson.cameraList[i].playlistName = playlistName;
                    break;
                }
            }

            if (!found) {
                console.error('Playlist "' + settingsJson.cameraList[i].playlistNiceName + '" not found');
                process.exit(1);
            }
        }

        switchCamera();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

function subscribeEvents(num, camera) {
    let cv = new CameraVapix({
        'protocol': 'http',
        'ip': camera.ip,
        'port': 80,
        'auth': camera.user + ':' + camera.pass
    });

    cv.on('eventsConnect', () => { console.log('Events connected'); });
    cv.on('eventsDisconnect', (err) => {
        console.log('Events disconnected: ' + err);
        process.exit(1);
    });

    cv.on('axis:CameraApplicationPlatform/VMD/Camera1Profile1/.', (event) => {
        try {
            let simpleItem = event['tt:MetadataStream']['tt:Event']
            [0]['wsnt:NotificationMessage']
            [0]['wsnt:Message']
            [0]['tt:Message']
            [0]['tt:Data']
            [0]['tt:SimpleItem'];
            for (let i = 0; i < simpleItem.length; i++) {
                if (simpleItem[i]['$'].Name == 'active') {
                    let active = simpleItem[i]['$'].Value == 1;
                    console.log('camera ' + num + ' vmd active: ' + active);
                    vmdActive[num] = active;
                    switchCamera();
                    break;
                }
            }
        } catch (err) {
            console.error('Invalid event data: ' + err);
        }
    });
    cv.eventsConnect();
    cameraVapix.push(cv);
}

function switchCamera() {
    if ((vmdActive[0] && vmdActive[1]) || (!vmdActive[0] && !vmdActive[1])) {
        if (selectedCameraIndex == null || Date.now() - selectedCameraTime >= settingsJson.minPeriod * 1000) {
            if (selectedCameraIndex == null) {
                selectedCameraIndex = -1;
            }
            let newSelectedCameraIndex = ((selectedCameraIndex + 1) % 2);
            if (newSelectedCameraIndex != selectedCameraIndex) {
                selectedCameraIndex = newSelectedCameraIndex;
                selectedCameraTime = Date.now();
                console.log('Switch to camera: ' + selectedCameraIndex);
                csw.playlistSwitch(settingsJson.cameraList[selectedCameraIndex].playlistName);

                clearTimeout(switchTimer);
                switchTimer = setTimeout(switchCamera, settingsJson.minPeriod * 1000);
            }
        }
    } else {
        if (Date.now() - selectedCameraTime >= settingsJson.minPeriod * 1000) {
            let newSelectedCameraIndex = vmdActive[0] ? 0 : 1;
            if (newSelectedCameraIndex != selectedCameraIndex) {
                selectedCameraIndex = newSelectedCameraIndex;
                selectedCameraTime = Date.now();
                console.log('Switch to camera: ' + selectedCameraIndex);
                csw.playlistSwitch(settingsJson.cameraList[selectedCameraIndex].playlistName);

                clearTimeout(switchTimer);
                switchTimer = setTimeout(switchCamera, settingsJson.minPeriod * 1000);
            }
        }
    }
}

start();