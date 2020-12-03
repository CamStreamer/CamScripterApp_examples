const fs = require('fs');
const https = require('follow-redirects').https;
const url = require('url');
const httpRequest = require('camstreamerlib/HTTPRequest');
const CamOverlayAPI = require('camstreamerlib/CamOverlayAPI');
const { setInterval } = require('timers');


let user = 'root';
let pass = 'pass';
let accessToken = '';
let stationID = '';
let syncPeriod = 3600;
let coServiceID = 1;
let timeOffset = 0;
let temperatureUnits = 'celsius';
let coQuery = null;
let coUpdateInProgress = false;

process.on('unhandledRejection', function(error) {
  console.error('unhandledRejection', error.message);
}); //error handling
console.log("Hello Wheatherflow!")

try { 
  const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
  const settings = JSON.parse(data);
  if (typeof settings.camera_user == 'string' && typeof settings.camera_pass == 'string' &&
      typeof settings.access_token == 'string' && typeof settings.station_id == 'string' && typeof settings.sync_period == 'number' &&
      typeof settings.co_service_id == 'number' && typeof settings.time_offset == 'number' &&
      typeof settings.temperature_units == 'string') {

    user = settings.camera_user;
    pass = settings.camera_pass;
    accessToken = settings.access_token;
    stationID = settings.station_id;
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


/*
* fields = [
    {
      field_name: name1
      text: text1
      color: color1
    },
    {
      ...
    }
  ]
*/
CamOverlayAPI.prototype.updateCustomGraphics= function(action,fields){
  let pathofCG = "/local/camoverlay/api/customGraphics.cgi?";
  let cg_action = "action="+action;
  let cg_service = "&service_id="+this.serviceID;
  let field_specs = "";
 
  for(let i = 0;i<fields.length;i++){
    let f = fields[i];
    field_specs+="&";
    let name = f.field_name;
    field_specs += name+"="+f.text;
    field_specs += "&"+name+"_color="+f.color;
  }
  console.log(pathofCG + cg_action + cg_service + field_specs);
  var promise = new Promise(function(resolve, reject) {
    httpRequest({
      "method":"POST",
      "host": this.ip,
      "port": this.port,
      "path": encodeURI(pathofCG + cg_action + cg_service + field_specs),
      "auth": this.auth
    },"").then(function(response) {
      resolve();
    }, reject);
  }.bind(this));
  return promise;
}





function timestamp(ux_timestamp){
  let date = new Date(ux_timestamp*1000);
  var month = new Array();
  month[0] = "January";
  month[1] = "February";
  month[2] = "March";
  month[3] = "April";
  month[4] = "May";
  month[5] = "June";
  month[6] = "July";
  month[7] = "August";
  month[8] = "September";
  month[9] = "October";
  month[10] = "November";
  month[11] = "December";
  return month[date.getMonth()] +" "+ date.getDate()+", "+date.getHours()+":"+date.getMinutes();
}
function temperature(value,units,degree=true){ 
  
  let unit = degree ? "°"+units.toUpperCase(): units.toUpperCase();
  return value+unit;
}
function wind(value,unit){ 
  return value+unit;
}
function precip(value, unit){ 
  return value+unit;
}
function pressure(value,unit){ 
  return value+unit;
}
function direction(degrees){ 
  let directions = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW","N"];
  let index = degrees % 360;
  index = Math.round(index/ 22.5,0)+1;
  compassdir = directions[index];
  return compassdir;
}
/*
timestamp
airTemperature
barometricPressure
windAvg
windDirection
windGust
precipAccumLast1hr 
*/
function conversion(raw_data){
  let units = raw_data.station_units;
  let vals = raw_data.obs[0];
  let result = {
    "timestamp": timestamp(vals.timestamp),
    "airTemperature": temperature(vals.air_temperature, units.units_temp),
    "barometricPressure": pressure(vals.barometric_pressure, units.units_pressure),
    "windAvg": wind(vals.wind_avg, units.units_wind),
    "windDirection": direction(vals.wind_direction),
    "windGust": wind(vals.wind_gust, units.units_wind),
    "precipAccumLast1hr":precip(vals.precip_accum_last_1hr, units.units_precip),
  };
  return result;
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

function reqWheatherflowData(station,acc_token){
  let wheatherAPIUrl = "https://swd.weatherflow.com/swd/rest/observations/station/"+station+"?token="+acc_token;
  let data = sendRequest(wheatherAPIUrl, "").then(function(results){
    console.log("Converting!");
    var res = conversion(JSON.parse(results));
    let fields = []
    for(v in res){
      fields.push({
        "field_name": v,
        "text": res[v],
        "color": "255255255" //všechno paušálně bíle zatím
      })    
    }
    co.updateCustomGraphics("update_text",fields);
    //console.log(fields);
  },()=>{console.log("Error Wheather Request")});
}
var co = new CamOverlayAPI({
  'ip': '127.0.0.1',
  'port': 80,
  'auth': user + ':' + pass,
  //'serviceName': 'Wheather Flow',
  'serviceID': coServiceID,
});

co.on('msg', function(msg) {
  //console.log('COAPI-Message: ' + msg);
});

co.on('error', function(err) {
  console.log('COAPI-Error: ' + err);
});

co.on('close', function() {
  console.log('COAPI-Error: connection closed');
  process.exit(1);
});

var fields = [{
  "field_name":"santa",
  "text": "HoHoHo",
  "color":"255255255"
},{
  "field_name":"satan",
  "text": "HaHaHa",
  "color":"255255255"
}];


console.log("Updating Wheatherflow!")
reqWheatherflowData("26334","d8e23bd3-b235-4c64-9a21-39b1e8199913");
//co.updateCustomGraphics("update_text",fields);

//var text = reqWheatherflowData("26334","d8e23bd3-b235-4c64-9a21-39b1e8199913");
//console.log(text);