const url = require("url");
const { fork } = require("child_process");
const { HttpServer } = require("camstreamerlib/HttpServer");

let http_server = new HttpServer();
console.log("Starting Flowmeter Package...");
http_server.on("error", function (err) {
    console.log(err);
});

http_server.on("access", function (msg) {
    console.log(msg);
});

http_server.onRequest("/reset_counter.cgi", function (req, res) {
    console.log('access: reset counter');
    clearCounter();
    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end();
});
http_server.onRequest("/calibrate.cgi", function (req, res) {
    console.log('access: calibrate');
    var urlParts = url.parse(req.url, true);
    var query = urlParts.query;
    calibrate(query["volume"]);
    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end();
});
http_server.onRequest("/start.cgi", function (req, res) {
    console.log('access: start');
    start();
    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end();
});

let main_process;
let calibrating_process;
let timeout;

function stopMainProcess() {
    if (main_process && main_process.exitCode === null) {
        main_process.removeAllListeners();
        main_process.kill("SIGTERM");
    }
    clearTimeout(timeout);
}

function stopCalibratingProcess() {
    if (calibrating_process && calibrating_process.exitCode === null) {
        calibrating_process.kill("SIGTERM");
    }
}

function calibrate(amount) {
    stopCalibratingProcess();
    calibrating_process = fork("calibrate.js", [amount.toString()], {
        stdio: "inherit",
    });
}

function clearCounter() {
    stopMainProcess();
    stopCalibratingProcess();

    calibrating_process = fork("reset.js", {
        stdio: "inherit",
    });
}

function start() {
    stopMainProcess();
    main_process = fork("feed.js", {
        stdio: "inherit",
    });

    main_process.on("close", (code, signal) => {
        timeout = setTimeout(start, 3000);
    });
}

process.on("SIGINT", (signal) => {
    stopMainProcess();
});

process.on("SIGTERM", async (signal) => {
    stopMainProcess();
    stopCalibratingProcess();

    await http_server.close();
    process.exit(0);
});
