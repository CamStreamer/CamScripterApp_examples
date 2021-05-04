const url = require('url');
const fs = require('fs');
const { http, https } = require('follow-redirects');
const CamOverlayAPI = require('camstreamerlib/CamOverlayAPI');
const HTTPRequest = require('camstreamerlib/HTTPRequest')

let settings = null;
let co = null;
let default_period_time = 1000;

function run() {
  try {
    const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
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

  co.connect().then(() => {
    oneAppPeriod(co);
  }, () => {
    console.log('COAPI-Error: connection error');
    process.exit(1);
  });
}

function sendRequest(raw_url, auth) {
  return new Promise((resolve, reject) => {
    send_url = new url.URL(raw_url);
    let authorisation = send_url.username && send_url.password ? (send_url.username + ":" + send_url.password) : auth;

    let client = send_url.protocol === 'http:' ? http : https;
    let options = {
      method: "GET",
      host: send_url.hostname,
      port: send_url.port,
      path: send_url.pathname + send_url.search,
      timeout: 5000 //5s
    };
    if (authorisation){
      options.auth = authorisation;
    }
    const req = client.request(options, (res) => {
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

function mapRequests(data){
  let trigger_requests = [];
  for (let i = 0; i < settings.field_list.length; i++){
    let value = findIn(settings.field_list[i].field,data);
    if (settings.field_list[i].trigger == value){
      trigger_requests.push(settings.field_list[i].command);
    }

  }
  return trigger_requests;
}
function findIn(field_name, field_list){
  for (let f of field_list){
    if (f.title["$t"] == field_name){
      return f.content["$t"];
    }
  }
}

async function requestSheet(doc_id) {
  if (!doc_id) return null; //skip if no doc_id is provided

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

function fireRequests(request_field){
  for (let i = 0; i < request_field.length; i++){
    console.log("Fire request: " + request_field[i]);
    sendRequest(request_field[i], null);
  }
}

async function oneAppPeriod(co){
  try{
    let data = await requestSheet(settings.sheet_addr);
    if (data){
      let requests = mapRequests(data.feed.entry);
      fireRequests(requests);
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
