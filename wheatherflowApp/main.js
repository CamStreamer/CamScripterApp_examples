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
let updatePeriod = 5; // minute count
let coServiceID = 1;
let timeOffset = 0;
let unitSystem = 'metric';
let location = "Hic Sunt Leones";
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
      typeof settings.access_token == 'string' && typeof settings.station_id == 'number' && typeof settings.wheather_check_period == 'number' &&
      typeof settings.co_service_id == 'number' && typeof settings.time_offset == 'number' && typeof settings.location == 'string' &&
      typeof settings.units == 'string') {

    user = settings.camera_user;
    pass = settings.camera_pass;
    accessToken = settings.access_token;
    stationID = settings.station_id.toString();
    updatePeriod = settings.wheather_check_period //minute count
    coServiceID = settings.co_service_id;
    timeOffset = settings.time_offset;
    unitSystem = settings.units;
    location = settings.location;

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



const unit_monikers = { //translation of unit propmts to displayable text
  "c": "°C",
  "f": "°F",
  "mph": "mph",
  "km/h": "km/h",
  "m/s": "m/s",
  "in": "in",
  "mm": "mm",
  "inhg": "inHg",
  "hpa": "hPa",
  "mi": "mi",
  "km": "km"
};
const units_systems = {
  "metric":{
    "units_temp": "c",
    "units_pressure": "hpa",
    "units_distance": "km",
    "units_precip": "mm",
    "units_wind": "km/h"   
  },
  "imperial":{
    "units_temp": "f",
    "units_pressure": "inhg",
    "units_distance": "mi",
    "units_precip": "in",
    "units_wind": "mph"
  },
  "conversions":{ // from metric to imperial
    "imperial":{
      "units_temp": [32,1.8,1], // [offset, ratio]  ratio = imp(met(1))
      "units_pressure": [0,0.02953,1],
      "units_distance": [0,0.621371192,2],
      "units_precip": [0,0.0393700787,2],
      "units_wind": [0,0.621371192,2]
    }
  }
};

function createConvertor(offset,u_ratio,fixed_dec){
  return (value)=>{return ((value * u_ratio) + offset).toFixed(fixed_dec)};    
}
function createInvConvertor(offset,u_ratio,fixed_dec){
  return (value)=>{return ((value - offset)/ u_ratio).toFixed(fixed_dec);};    
}

var convertors = {
  "imperial":{},
  "metric":{}
}; //origin:target

for (unit_class in units_systems.conversions.imperial){
  conv = units_systems.conversions.imperial[unit_class];
  convertors["imperial"][unit_class] = createConvertor(conv[0],conv[1]);
  convertors["metric"][unit_class] = (x)=>{return x}; 
}

function parseTime(date, eng_time = false){
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
  let time = "0:00";
  if (eng_time){
    let cz_hours = date.getHours();
    let en_hours = cz_hours % 12;
    let am_pm = "AM";
    if (cz_hours >= 12){
      am_pm = "PM"
      if (en_hours == 0) {
        en_hours = 12;
      }
    }
    time = (en_hours)+":"+("0"+date.getMinutes()).slice(-2) + " " + am_pm;
  }else{
    time = ("0"+date.getHours()).slice(-2)+":"+("0"+date.getMinutes()).slice(-2);
  }
  return [month[date.getMonth()],date.getDate(),time];
}

function simpleUnit(value,unit_type){
  //console.log(convertors);
  return convertors[unitSystem][unit_type](value)+unit_monikers[units_systems[unitSystem][unit_type]];
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
precipAccumLast1h
date
time
location 
*/
function mapData(raw_data){
  //let station_units = raw_data.station_units;
  //PŘÍCHOZÍ HODNOTY JSOU VŽDY METRIC
  let vals = raw_data.obs[0];
  let UXtime = parseTime(new Date(vals.timestamp*1000));
  let timestamp = UXtime[0]+" "+UXtime[1]+", "+UXtime[2];
  let cameratime = parseTime(new Date(), true);
  let date = unitSystem == "metric" ? cameratime[1]+" "+cameratime[0] : cameratime[0]+" "+cameratime[1];
  let time = cameratime[2]; 
  let result = {
    "timestamp": timestamp, //ČASOVÁ ZÓNA!
    "airTemperature": simpleUnit(vals.air_temperature,"units_temp"),
    "barometricPressure": simpleUnit(vals.barometric_pressure, "units_pressure"),
    "windAvg": simpleUnit(vals.wind_avg, "units_wind"),
    "windDirection": direction(vals.wind_direction),
    "windGust": simpleUnit(vals.wind_gust, "units_wind"),
    "precipAccumLast1hr": simpleUnit(vals.precip_accum_last_1hr, "units_precip"),
    "date":date,
    "time": time,
    "location" : location
  };
  return result;
}
function sendRequest(sendUrl, auth) {
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

async function reqWheatherflowData(station,acc_token){
  try{
      let wheatherAPIUrl = "https://swd.weatherflow.com/swd/rest/observations/station/"+station+"?token="+acc_token;
      const data = await sendRequest(wheatherAPIUrl, "");
      console.log("Data aquired!");
      return JSON.parse(data);
  }catch(error){
    console.log("Error Wheather Request");
    console.log(error);
  }
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

var count = 0;
var unmapped_data;
async function oneAppPeriod(){
  //
  try{
    if (count == 0){ //jednou za X period žádáme o data Wheatherflow
      unmapped_data = await reqWheatherflowData(stationID,accessToken);
    }
    console.log("Updating CO");
    var res = mapData(unmapped_data);
    let fields = [];
    for(v in res){
    fields.push({
        "field_name": v,
        "text": res[v],
        "color": "255255255" //všechno paušálně bíle zatím
      });    
    }
    co.updateCustomGraphics("update_text",fields);
    count++;
    count %= updatePeriod*12 //uP*12*5s == uP*60s
  }catch(error){
    console.log("Error Wheather Request Higher");
    console.log(error);
  }  
}

oneAppPeriod()
setInterval(oneAppPeriod,5000);

//co.updateCustomGraphics("update_text",fields);
