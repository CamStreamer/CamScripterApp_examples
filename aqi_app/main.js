const url = require('url');
const fs = require('fs');
const https = require("follow-redirects").https;
const CairoFrame = require('./CairoFrame');
const CairoPainter = require('./CairoPainter');
const CamOverlayAPI = require('camstreamerlib/CamOverlayAPI');
const parse = require('csv-parse/lib/sync');
const { send } = require('process');
const CameraVapix = require('camstreamerlib/CameraVapix');


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
  } catch (err) {
    console.log('No settings file found');
    return;
  }
  cv = new CameraVapix({
    'protocol': 'http',
    'ip': '127.0.0.1',
    'port': 80,
    'auth': 'root:pass',
  });
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
    await getWindow();
    uploadCodeImages(co,codes);
    frames = genLayout(cam_width,cam_height);
    oneAppPeriod(co,frames);
    setInterval(oneAppPeriod, 5000, co, frames);
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

async function getWindow(){
  const data = await cv.getParameterGroup ("image.i0.appearance");
  let resolution = data["root.Image.I0.Appearance.Resolution"].split("x");
  cam_width = parseInt(resolution[0]);
  cam_height = parseInt(resolution[1]);
}


async function uploadCodeImages(co, codes){
  for (let c in codes){
    console.log(JSON.stringify(codes[c]));
    const image_data = await uploadImage(process.env.PERSISTENT_DATA_PATH + "images/" + codes[c].img_file,co,"fit");
    codes[c].image = image_data;
    console.log(JSON.stringify(codes[c]));
  }
}

function uploadImage(fileName, co) {
  var imgData = fs.readFileSync(fileName);
  const promise = co.uploadImageData(imgData);
  return promise;
}
var codes = {
  "good": {
    "text": "Good",
    "img_file": "Good.png",
    "image": undefined,
    "color": [0,153/255,76/255]
  },
  "moderate": {
    "text": "Moderate",
    "img_file":"Moderate.png",
    "image": undefined,
    "color": [1.0,1.0,51/255]
  },
  "sensitive": {
    "text": "Unhealthy SG",
    "img_file": "sensitive_groups.png",
    "image": undefined,
    "color": [1.0,128/255,0]
  },
  "unhealthy": {
    "text": "Unhealthy",
    "img_file": "Unhealthy.png",
    "image": undefined,
    "color": [1.0,51/255,51/255]
  },
  "vunhealthy":{
    "text": "Very Unhealthy",
    "img_file": "Very_Unhealthy.png",
    "image": undefined,
    "color": [102/255,0,204/255]
  },
  "hazard":{
    "text": "Hazardous",
    "img_file":"Hazardous.png",
    "image": undefined,
    "color": [153/255,0,0]
  }
};

function mapData(data, frames){
  let value = data.data.aqi;
  frames.value.setText(value,"A_CENTER",[1.0,1.0,1.0]);
  frames.label.setText(settings.display_location,"A_CENTER",[1.0,1.0,1.0]);
  let code = null;
  if (value <= 50){
    code = codes.good;
  }else if (value <= 100){
    code = codes.moderate;
  }else if (value <= 150){
    code = codes.sensitive;
  }else if (value <= 200){
    code = codes.unhealthy;
  }else if (value <= 300){
    code = codes.vunhealthy;
  }else {
    code = codes.hazard;
  }
  frames.background.setBgImage(code.image,"fit");
}

function genLayout(resolution_w, resolution_h){
  let layout = {};
  layout.background = new CairoPainter(resolution_w, resolution_h,settings.coordinates,settings.pos_x,settings.pos_y,180,180,null,null,null);
  layout.value = new CairoFrame(0,25,180,70,null,"0",[1.0,1.0,1.0]);
  layout.label = new CairoFrame(0,10,180,20,null,"",[1.0,1.0,1.0]);
  layout.background.insert(layout.value);
  layout.background.insert(layout.label);
  return layout;
}

async function requestAQI(location, acc_token) {
  try {
    let api_url = "https://api.waqi.info/feed/" + location + "/?token=" + acc_token;
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
async function oneAppPeriod(co,layout){
  try{
    if (period_count % settings.update_frequency * 12 == 0){
      data = await requestAQI(settings.location, settings.access_token);
      period_count = 0;
    }
    mapData(data,layout);
    frames.background.generateImage(co, settings.scale/100);
  } catch(error){
    console.log(error);
  }
}

process.on('unhandledRejection', function (error) {
  console.log('unhandledRejection', error.message);
});

run();
