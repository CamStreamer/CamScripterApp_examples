const fs = require("fs");
const url = require("url");

const { https } = require("follow-redirects");
const { CamOverlayAPI } = require("camstreamerlib/CamOverlayAPI");

var settings = null;
const serviceIDs = [];
let co = null;
var default_period_time = 1000;

function getCOAPI(camera_ip, camera_port, camera_auth) {
    let co = new CamOverlayAPI({
        ip: camera_ip,
        port: camera_port,
        auth: camera_auth,
    });

    return co;
}
function run() {
    try {
        var data = fs.readFileSync(
            process.env.PERSISTENT_DATA_PATH + "settings.json"
        );
        settings = JSON.parse(data);
    } catch (err) {
        console.log("No settings file found");
        return;
    }

    co = getCOAPI(settings.camera_ip, settings.camera_port, settings.camera_user + ":" + settings.camera_pass);
    for (let i = 0; i < settings.field_list.length; i++) {
        let c_field = settings.field_list[i];
        serviceIDs.push(Number.parseInt(c_field["service"]))
    }
    oneAppPeriod();
}

function sendRequest(send_url, auth) {
    return new Promise((resolve, reject) => {
        send_url = url.parse(send_url);
        let options = {
            method: "GET",
            host: send_url.hostname,
            port: send_url.port,
            path: send_url.path,
            headers: { Authorization: auth },
            timeout: 5000, //5s
        };
        const req = https.request(options, (res) => {
            res.setEncoding("utf8");
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                if (res.statusCode != 200) {
                    reject(
                        new Error(
                            "Server returned status code: " +
                            res.statusCode +
                            ", message: " +
                            data
                        )
                    );
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

function mapData(data) {
    let overlay_fields = {};
    for (let i = 0; i < settings.field_list.length; i++) {
        let name = settings.field_list[i].name;
        let value = findIn(settings.field_list[i].field, data);
        let service = settings.field_list[i].service;
        if (!(service in overlay_fields)) {
            overlay_fields[service] = [];
        }
        overlay_fields[service].push({
            field_name: name,
            text: value,
        });
    }
    return overlay_fields;
}
function findIn(field_name, data) {
    let column = field_name.match(/[a-zA-Z]+/i)[0];
    let row = field_name.match(/[0-9]+/i)[0];

    let column_n = convertColumn(column.toLowerCase());
    let row_n = parseInt(row) - 1;

    return data[row_n][column_n];
}

function convertColumn(text) {
    let re_val = 0;
    for (let i = text.length - 1; i >= 0; i--) {
        re_val += text.charCodeAt(i) - "a".charCodeAt(0);
        re_val *= 27 ** (text.length - i - 1);
    }
    return re_val;
}

async function requestSheet(doc_id) {
    try {
        let api_url =
            "https://sheets.googleapis.com/v4/spreadsheets/" +
            doc_id +
            "/values/" +
            settings.list_name +
            "?alt=json&key=" +
            settings.api_key;
        console.log("URL: " + api_url);
        const data = await sendRequest(api_url, "");
        console.log("Data aquired!");
        return JSON.parse(data);
    } catch (error) {
        console.log("Cannot get data form Google Sheets");
        console.log(error);
    }
}

async function oneAppPeriod() {
    console.log("Starting Period");

    try {
        let data = null;
        let fields = null;
        for (let service of serviceIDs) {
            let enabled = await co.isEnabled(service);
            if (enabled) {
                if (!fields) {
                    data = await requestSheet(settings.sheet_addr);
                    fields = mapData(data.values);
                }
                let cf = fields[service];
                co.updateCGText(service, cf);
            }
        }
    } catch (error) {
        console.log(error);
    } finally {
        setTimeout(
            oneAppPeriod,
            settings.refresh_rate * default_period_time,
        );
    }
}

process.on("unhandledRejection", function (error) {
    console.log("unhandledRejection", error.message);
});

run();
