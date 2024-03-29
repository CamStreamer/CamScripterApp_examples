const fs = require('fs');
const { CamOverlayDrawingAPI } = require('camstreamerlib/CamOverlayDrawingAPI');

let settings = null;

let cod = null;
let imgClockFace = null;
let imgCentre = null;
let imgHourHand = null;
let imgMinuteHand = null;
let imgSecondHand = null;

function clockRun() {
    try {
        let data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        settings = JSON.parse(data);
    } catch (err) {
        console.log('No settings file found');
        return;
    }

    cod = new CamOverlayDrawingAPI({
        'ip': settings.camera_ip ? settings.camera_ip : '127.0.0.1',
        'port': settings.camera_port ? settings.camera_port : 80,
        'auth': settings.camera_user + ':' + settings.camera_pass,
    });

    cod.on('message', function (msg) {
        //console.log('COAPI-Message: ' + msg);
    });

    cod.on('error', function (err) {
        console.log('COAPI-Error: ' + err);
    });

    cod.on('close', function () {
        console.log('COAPI-Error: connection closed');
        process.exit(1);
    });

    cod.connect().then(function () {
        setInterval(createImage, 1000, cod);
    }, function () {
        console.log('COAPI-Error: connection error');
    });
}

function createImage(cod) {
    loadImages().then(function () {
        cod.cairo('cairo_image_surface_create', 'CAIRO_FORMAT_ARGB32', Math.floor(263 * settings.scale), Math.floor(265 * settings.scale)).then(function (surfaceRes) {
            let surface = surfaceRes.var;
            cod.cairo('cairo_create', surface).then(function (cairoRes) {
                let cairo = cairoRes.var;

                // Write clock face
                cod.cairo('cairo_scale', cairo, settings.scale, settings.scale);
                cod.cairo('cairo_translate', cairo, 0, 0);
                cod.cairo('cairo_set_source_surface', cairo, imgClockFace, 0, 0);
                cod.cairo('cairo_paint', cairo);

                let d = new Date();
                let hourAngle = (d.getHours() + d.getMinutes() / 60) / 12 * 2 * Math.PI + Math.PI;
                let minAngle = (d.getMinutes() + (d.getSeconds() + 1) / 60) / 60 * 2 * Math.PI + Math.PI;
                let secAngle = (d.getSeconds() + 1) / 60 * 2 * Math.PI + Math.PI;

                // Write hours
                cod.cairo('cairo_identity_matrix', cairo);
                cod.cairo('cairo_scale', cairo, settings.scale, settings.scale);
                cod.cairo('cairo_translate', cairo, 131, 132);
                cod.cairo('cairo_rotate', cairo, hourAngle);
                cod.cairo('cairo_translate', cairo, -5, -16);
                cod.cairo('cairo_set_source_surface', cairo, imgHourHand, 0, 0);
                cod.cairo('cairo_paint', cairo);

                // Write minutes
                cod.cairo('cairo_identity_matrix', cairo);
                cod.cairo('cairo_scale', cairo, settings.scale, settings.scale);
                cod.cairo('cairo_translate', cairo, 131, 132);
                cod.cairo('cairo_rotate', cairo, minAngle);
                cod.cairo('cairo_translate', cairo, -5, -20);
                cod.cairo('cairo_set_source_surface', cairo, imgMinuteHand, 0, 0);
                cod.cairo('cairo_paint', cairo);

                // Write seconds
                cod.cairo('cairo_identity_matrix', cairo);
                cod.cairo('cairo_scale', cairo, settings.scale, settings.scale);
                cod.cairo('cairo_translate', cairo, 131, 132);
                cod.cairo('cairo_rotate', cairo, secAngle);
                cod.cairo('cairo_translate', cairo, 0, -20);
                cod.cairo('cairo_set_source_surface', cairo, imgSecondHand, 0, 0);
                cod.cairo('cairo_paint', cairo);

                // Write clock center
                cod.cairo('cairo_identity_matrix', cairo);
                cod.cairo('cairo_scale', cairo, settings.scale, settings.scale);
                cod.cairo('cairo_translate', cairo, 125, 127);
                cod.cairo('cairo_set_source_surface', cairo, imgCentre, 0, 0);
                cod.cairo('cairo_paint', cairo);

                cod.showCairoImageAbsolute(surface, settings.pos_x, settings.pos_y, settings.width, settings.height);

                // Cleanup
                cod.cairo('cairo_surface_destroy', surface);
                cod.cairo('cairo_destroy', cairo);
            });
        });
    })
}

function loadImages() {
    let promise = new Promise(function (resolve, reject) {
        if (imgClockFace == null) {
            loadImage('clock_face.png').then(function (img) {
                imgClockFace = img;
                loadImage('centre.png').then(function (img) {
                    imgCentre = img;
                    loadImage('hour_hand.png').then(function (img) {
                        imgHourHand = img;
                        loadImage('minute_hand.png').then(function (img) {
                            imgMinuteHand = img;
                            loadImage('sec_hand.png').then(function (img) {
                                imgSecondHand = img;
                                resolve();
                            });
                        });
                    });
                });
            });
        } else {
            resolve();
        }
    });
    return promise;
}

function loadImage(fileName) {
    let promise = new Promise(function (resolve, reject) {
        let imgData = fs.readFileSync(fileName);
        cod.uploadImageData(imgData).then(function (imgSurfaceRes) {
            resolve(imgSurfaceRes.var);
        });
    });
    return promise;
}

process.on('unhandledRejection', function (error) {
    console.log('unhandledRejection', error.message);
});
process.on('uncaughtException', function (error) {
    console.log('uncaughtException', error.message);
});

clockRun();