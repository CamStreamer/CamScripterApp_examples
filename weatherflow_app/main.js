const fs = require("fs");
const url = require("url");
const { setInterval } = require("timers");
const { https } = require("follow-redirects");
const { CamOverlayAPI } = require("camstreamerlib/CamOverlayAPI");


let user = "root";
let pass = "pass";
let cameraIp = "127.0.0.1";
let camPort = 80;
let accessToken = "";
let stationID = "";
let updatePeriod = 5; // minute count
let coServiceID = 1;
let timeOffset = 0;
let unitSystem = "metric";
let location = "Name of location";

process.on("unhandledRejection", function (error) {
    console.error('unhandledRejection', error.message);
}); //error handling
console.log("Hello WeatherFlow!");

try {
    const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + "settings.json");
    const settings = JSON.parse(data);
    if (typeof settings.camera_user == "string" && typeof settings.camera_pass == "string" &&
        typeof settings.access_token == "string" && typeof settings.station_id == "number" && typeof settings.wheather_check_period == "number" &&
        typeof settings.co_service_id == "number" && typeof settings.time_offset == "number" && typeof settings.location == "string" &&
        typeof settings.units == "string") {

        user = settings.camera_user;
        pass = settings.camera_pass;
        cameraIp = settings.camera_ip;
        camPort = settings.camera_port;
        accessToken = settings.access_token;
        stationID = settings.station_id.toString();
        updatePeriod = settings.wheather_check_period; //minute count
        coServiceID = settings.co_service_id;
        timeOffset = settings.time_offset;
        unitSystem = settings.units;
        location = settings.location;
        if (accessToken == "") {
            console.error("No Access Token!");
        }

    } else {
        console.error("Invalid or incomplete configuration found");
        return;
    }
} catch (err) {
    console.error("No settings file found");
    return;
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
    "metric": {
        "units_temp": "c",
        "units_pressure": "hpa",
        "units_distance": "km",
        "units_precip": "mm",
        "units_wind": "m/s"
    },
    "imperial": {
        "units_temp": "f",
        "units_pressure": "inhg",
        "units_distance": "mi",
        "units_precip": "in",
        "units_wind": "mph"
    },
    "conversions": { // from metric to imperial
        "imperial": {
            "units_temp": [32, 1.8, 1], // [offset, ratio]  ratio = imp(met(1))
            "units_pressure": [0, 0.02953, 1],
            "units_distance": [0, 0.621371192, 2],
            "units_precip": [0, 0.0393700787, 2],
            "units_wind": [0, 2.2369362920544, 2]
        }
    }
};

function createConvertor(offset, u_ratio, fixed_dec) {
    return (value) => { return ((value * u_ratio) + offset).toFixed(fixed_dec); };
}
function createInvConvertor(offset, u_ratio, fixed_dec) {
    return (value) => { return ((value - offset) / u_ratio).toFixed(fixed_dec); };
}

var convertors = {
    "imperial": {},
    "metric": {}
}; //origin:target

for (unit_class in units_systems.conversions.imperial) {
    conv = units_systems.conversions.imperial[unit_class];
    convertors["imperial"][unit_class] = createConvertor(conv[0], conv[1], conv[2]);
    convertors["metric"][unit_class] = (x) => { return x; };
}

function parseTime(date, eng_time = false) {
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
    if (eng_time) {
        let cz_hours = date.getHours();
        let en_hours = cz_hours % 12;
        let am_pm = "AM";
        if (cz_hours >= 12) {
            am_pm = "PM";
            if (en_hours == 0) {
                en_hours = 12;
            }
        }
        time = (en_hours) + ":" + ("0" + date.getMinutes()).slice(-2) + " " + am_pm;
    } else {
        time = ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
    }
    return [month[date.getMonth()], date.getDate(), time];
}

function simpleUnit(value, unit_type) {
    return convertors[unitSystem][unit_type](value) + unit_monikers[units_systems[unitSystem][unit_type]];
}

function direction(degrees) {
    let directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW", "N"]; //17
    let index = degrees % 360;
    index = Math.round(index / 22.5, 0);
    compassdir = directions[index];
    return compassdir;
}
/*
Field monikers:
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
function mapData(raw_data) {
    //INCOMING VALUES ARE ALWAYS IN METRIC
    let vals = raw_data.obs[0];
    let timestamp = new Date(vals.timestamp * 1000);
    let ux_date = timestamp.getTime() + (((timeOffset * 60) + timestamp.getTimezoneOffset()) * 60000);
    let ux_time = parseTime(new Date(ux_date));
    let timestamp_str = unitSystem == "metric" ? (ux_time[1] + " " + ux_time[0] + ", " + ux_time[2]) : (ux_time[0] + " " + ux_time[1] + ", " + ux_time[2]);
    let cameratime = parseTime(new Date(), true);
    let date = unitSystem == "metric" ? cameratime[1] + " " + cameratime[0] : cameratime[0] + " " + cameratime[1];
    let time = cameratime[2];
    let result = {
        "timestamp": timestamp_str,
        "airTemperature": simpleUnit(vals.air_temperature, "units_temp"),
        "barometricPressure": simpleUnit(vals.barometric_pressure, "units_pressure"),
        "windAvg": simpleUnit(vals.wind_avg, "units_wind"),
        "windDirection": direction(vals.wind_direction),
        "windGust": simpleUnit(vals.wind_gust, "units_wind"),
        "precipAccumLast1hr": simpleUnit(vals.precip_accum_last_1hr, "units_precip"),
        "date": date,
        "time": time,
        "location": location
    };
    return result;
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

async function reqWeatherflowData(station, acc_token) {
    try {
        let wheather_api_url = "https://swd.weatherflow.com/swd/rest/observations/station/" + station + "?token=" + acc_token;
        const data = await sendRequest(wheather_api_url, "");
        console.log("Data aquired!");
        return JSON.parse(data);
    } catch (error) {
        console.log("Cannot get data form station: " + station + " with access token: " + acc_token);
        //console.error(error);
    }
}

var co = new CamOverlayAPI({
    "ip": cameraIp,
    "port": camPort,
    "auth": user + ":" + pass,
});

var count = 0;
var unmapped_data;
async function oneAppPeriod() {
    try {
        if (count == 0) { //once in X periods we ask data from Weatherflow
            unmapped_data = await reqWeatherflowData(stationID, accessToken);
        }
        console.log("Updating CamOverlay");
        var res = mapData(unmapped_data);
        let fields = [];
        for (v in res) {
            fields.push({
                "field_name": v,
                "text": res[v]
                //"color": "255255255"
            });
        }
        await co.updateCGText(coServiceID, fields);
        count++;
        count %= updatePeriod * 12; //uP*12*5s == uP*60s
    } catch (error) {
        console.log("Error Updating CamOverlay");
        console.error(error);
    }
}

oneAppPeriod();
setInterval(oneAppPeriod, 5000);