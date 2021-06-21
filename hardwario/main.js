const fs = require('fs');
const https = require('follow-redirects').https;
const url = require('url');
const httpRequest = require('camstreamerlib/HTTPRequest');

let user = 'root';
let pass = '';
let bearerToken = '';
let camIP = '127.0.0.1';
let camPort = 80;
let groupID = '';
let deviceID = '';
let syncPeriod = 3600;
let coServiceID = 1;
let timeOffset = 0;
let temperatureUnits = 'celsius';

let coQuery = null;
let coUpdateInProgress = false;

process.on('unhandledRejection', function(error) {
  console.error('unhandledRejection', error.message);
});

try {
  const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
  const settings = JSON.parse(data);
  if (typeof settings.camera_user == 'string' && typeof settings.camera_pass == 'string' &&
      typeof settings.bearer_token == 'string' && typeof settings.group_id == 'string' &&
      typeof settings.device_id == 'string' && typeof settings.sync_period == 'number' &&
      typeof settings.co_service_id == 'number' && typeof settings.time_offset == 'number' &&
      typeof settings.temperature_units == 'string') {

    user = settings.camera_user;
    pass = settings.camera_pass;
    camPort = settings.camera_port
    bearerToken = settings.bearer_token;
    camIP = settings.camera_ip;
    groupID = settings.group_id;
    deviceID = settings.device_id;
    syncPeriod = settings.sync_period;
    coServiceID = settings.co_service_id;
    timeOffset = settings.time_offset;
    temperatureUnits = settings.temperature_units;

  } else {
    console.error("Invalid or incomplete configuration found");
    return;
  }
} catch (err) {
  console.error('No settings file found');
  return;
}

async function checkDeviceState() {
  try {
    let cloudAPIRequest = 'https://api.hardwario.cloud/v1/messages?group_id=' + groupID + '&device_id=' + deviceID + '&limit=1';
    let auth = 'Bearer ' + bearerToken;
    let response = await sendRequest(cloudAPIRequest, auth);
    let json = JSON.parse(response);
    if (json.length > 0) {
      processResponse(json[0]);
    }

  } catch (err) {
    console.error('Get data from source url error: ' + err.message);
  }
}

function processResponse(response) {
  let d = new Date();
  d.setTime(Date.parse(response.created_at) + timeOffset * 3600000);
  let timestamp = d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
  timestamp += ' ' + d.getUTCHours() + ':' + d.getUTCMinutes();

  // Cache query
  let temp = response.data.sensor.hygrometer.temperature.toFixed(1) + ' °C';
  if (temperatureUnits != 'celsius') {
    temp = (response.data.sensor.hygrometer.temperature * (9 / 5) + 32).toFixed(1) + ' °F';
  }

  coQuery = 'action=update_text&service_id=' + coServiceID + '&timestamp=' + encodeURIComponent(timestamp) +
    '&temperature=' + encodeURIComponent(temp) +
    '&humidity=' + encodeURIComponent(response.data.sensor.hygrometer.humidity.toFixed(1) + ' %');

  updateGraphics();
}

async function updateGraphics() {
  if (!coQuery || coUpdateInProgress) {
    return;
  }
  coUpdateInProgress = true;

  let options = {
    method: 'GET',
    host: camIP,
    port: camPort,
    path: '/local/camoverlay/api/customGraphics.cgi?' + coQuery,
    auth: user + ':' + pass,
    timeout: 10
  };
  try {
    await httpRequest(options);
  } catch (err) {
    //console.error(err);  // CO API returns status 400 if some of the fields doesn't exist
  }
  coUpdateInProgress = false;
}

async function sendRequest(sendUrl, auth) {
  return new Promise((resolve, reject) => {
    sendUrl = url.parse(sendUrl);
    let options = {
      method: 'GET',
      host: sendUrl.hostname,
      port: sendUrl.port,
      path: sendUrl.path,
      headers: { 'Authorization': auth },
      timeout: 10
    };
    const req = https.request(options, (res) => {
      res.setEncoding('utf8');

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode != 200) {
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

checkDeviceState();
setInterval(checkDeviceState, syncPeriod * 1000);
setInterval(updateGraphics, 60000);
