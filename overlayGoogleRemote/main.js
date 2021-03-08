const url = require('url');
const fs = require('fs');
const https = require("follow-redirects").https;
const CairoFrame = require('./CairoFrame');
const CairoPainter = require('./CairoPainter');
const CamOverlayAPI = require('camstreamerlib/CamOverlayAPI');
const { send } = require('process');


var settings = null;
var co = null;
var cv = null;
var frames = {};
var cam_width = null;
var cam_height = null;
function run() {
  try {
    var data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    settings = JSON.parse(data);
    let resolution = settings.resolution.split("x");
    cam_width = parseInt(resolution[0]);
    cam_height = parseInt(resolution[1]);
  } catch (err) {
    console.log('No settings file found');
    return;
  }


  co = new CamOverlayAPI({
    'ip': '127.0.0.1',
    'port': 80,
    'auth': settings.camera_user + ':' + settings.camera_pass,
    'serviceName': 'AQI'
  });

  co.on('error', (err) => {
    console.log('COAPI-Error: ' + err);
  });

  co.on('close', () => {
    console.log('COAPI-Error: connection closed');
    process.exit(1);
  });

  co.connect().then(async function(){
    console.log(await requestSheet());
    //oneAppPeriod(co,frames);
    //setInterval(oneAppPeriod, 5000, co, frames);
  }, () => {
    console.log('COAPI-Error: connection error');
    process.exit(1);
  });
}

function sendRequest(send_url, auth) {
  return new Promise((resolve, reject) => {
    send_url = url.parse(send_url);
    let options = {
      method: "GET",
      host: send_url.hostname,
      port: send_url.port,
      path: send_url.path,
      headers: { "Authorization": auth },
      timeout: 5000 //5s
    };
    const req = https.request(options, (res) => {
      res.setEncoding("utf8");
      let data = "";
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode != 200) {
          reject(new Error("Server returned status code: " + res.statusCode + ", message: " + data));
        } else {
          resolve(data);
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.end();
  });
}

function mapData(data){
  let overlay_fields = [];
  for (let i = 0; i < settings.field_list.lenght; i++){
    let name = settings.field_list[i].name;
    let value = findIn(settings.field_list[i].field,data);
    overlay_fields.push({
      "field_name": name,
      "text": value
    });
  }
  return overlay_fields;
}

async function requestSheet() {
  try {
    let api_url = "https://spreadsheets.google.com/feeds/cells/1wmqsFkIX4AXHCgpxOoZLG2Vi0mWBPEAqLQUvb4QnOcI/1/public/full?alt=json"
    const data = await sendRequest(api_url, "");
    console.log("Data aquired!");
    return JSON.parse(data);
  } catch (error) {
    console.log("Cannot get data form AQI");
    console.log(error);
  }
}
var period_count = 0;
var data = {};

async function oneAppPeriod(co){
  try{
    if (true){
      data = await requestSheet();
      period_count = 0;
    }
    let fields = mapData(data);
    co.updateCGText(fields);
  } catch(error){
    console.log(error);
  }
}

process.on('unhandledRejection', function (error) {
  console.log('unhandledRejection', error.message);
});

run();
