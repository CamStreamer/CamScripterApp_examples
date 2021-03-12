const url = require('url');
const fs = require('fs');
const https = require("follow-redirects").https;
const CamOverlayAPI = require('camstreamerlib/CamOverlayAPI');

var settings = null;
var co = null;
var default_period_time = 1000;
function run() {
  try {
    var data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    settings = JSON.parse(data);
  } catch (err) {
    console.log('No settings file found');
    return;
  }


  co = new CamOverlayAPI({
    'ip': '127.0.0.1',
    'port': 80,
    'auth': settings.camera_user + ':' + settings.camera_pass,
    'serviceID': settings.overlay_id
  });

  co.on('error', (err) => {
    console.log('COAPI-Error: ' + err);
  });

  co.on('close', () => {
    console.log('COAPI-Error: connection closed');
    process.exit(1);
  });

  co.connect().then(async function(){
    oneAppPeriod(co);
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
  for (let i = 0; i < settings.field_list.length; i++){
    let name = settings.field_list[i].name;
    let value = findIn(settings.field_list[i].field,data);
    overlay_fields.push({
      "field_name": name,
      "text": value
    });
  }
  return overlay_fields;
}
function findIn(field_name, field_list){
  for (let f of field_list){
    if (f.title["$t"] == field_name){
      return f.content["$t"];
    }
  }
}

async function requestSheet(doc_id) {
  try {
    let api_url = "https://spreadsheets.google.com/feeds/cells/"+doc_id+"/1/public/full?alt=json";
    const data = await sendRequest(api_url, "");
    console.log("Data aquired!");
    return JSON.parse(data);
  } catch (error) {
    console.log("Cannot get data form Google Sheets");
    console.log(error);
  }
}


async function oneAppPeriod(co){
  try{
    let enabled = await co.isEnabled()
    if (enabled) {
      let data = await requestSheet(settings.sheet_addr);
      let fields = mapData(data.feed.entry);
      co.updateCGText(fields);
    }
  } catch(error){
    console.log(error);
  } finally {
    setTimeout(oneAppPeriod, settings.refresh_rate * default_period_time, co);
  }
}

process.on('unhandledRejection', function (error) {
  console.log('unhandledRejection', error.message);
});

run();
