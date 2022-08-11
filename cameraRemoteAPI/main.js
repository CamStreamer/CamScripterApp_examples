const fs = require('fs');
const url = require('url');

const { http, https } = require('follow-redirects');
const { HTTPRequest } = require('camstreamerlib/HTTPRequest')
const { CamOverlayAPI } = require('camstreamerlib/CamOverlayAPI');

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
        'ip': settings.camera_ip,
        'port': settings.camera_port,
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
        if (authorisation) {
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

function mapRequests(data) {
    let trigger_requests = [];
    for (let i = 0; i < settings.field_list.length; i++) {
        let value = findIn(settings.field_list[i].field, data);
        if (settings.field_list[i].trigger == value) {
            trigger_requests.push(settings.field_list[i].command);
        }

    }
    return trigger_requests;
}
function findIn(field_name, data) {
    let column = field_name.match(/[a-zA-Z]+/i)[0];
    let row = field_name.match(/[0-9]+/i)[0];

    let column_n = convertColumn(column.toLowerCase());
    let row_n = parseInt(row) - 1;

    return data[row_n][column_n];
}

function convertColumn(text) {
    let re_val = 0
    for (let i = text.length - 1; i >= 0; i--) {
        re_val += text.charCodeAt(i) - "a".charCodeAt(0);
        re_val *= 27 ** (text.length - i - 1);
    }
    return re_val;
}

async function requestSheet(doc_id) {
    try {
        let api_url = 'https://sheets.googleapis.com/v4/spreadsheets/' + doc_id + '/values/' + settings.list_name + '?alt=json&key=' + settings.api_key;
        console.log("URL: " + api_url);
        const data = await sendRequest(api_url, "");
        console.log("Data aquired!");
        return JSON.parse(data);
    } catch (error) {
        console.log("Cannot get data form Google Sheets");
        console.log(error);
    }
}

function fireRequests(request_field) {
    for (let i = 0; i < request_field.length; i++) {
        console.log("Fire request: " + request_field[i]);
        sendRequest(request_field[i], null);
    }
}

async function oneAppPeriod(co) {
    try {
        let data = await requestSheet(settings.sheet_addr);
        if (data) {
            let requests = mapRequests(data.values);
            fireRequests(requests);
        }
    } catch (error) {
        console.log(error);
    } finally {
        setTimeout(oneAppPeriod, settings.refresh_rate * default_period_time, co);
    }
}

process.on('unhandledRejection', function (error) {
    console.log('unhandledRejection', error.message);
});

run();
