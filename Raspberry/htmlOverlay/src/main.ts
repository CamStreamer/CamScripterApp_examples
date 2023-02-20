import * as fs from 'fs';
import { URL } from 'url';
import { HtmlToOverlay, HtmlToOverlayOptions } from './htmlToOverlay';
import { HttpServer } from 'camstreamerlib/HttpServer';
import { CameraVapix } from 'camstreamerlib/CameraVapix';

let settingsList = [];
const overlayList: HtmlToOverlay[] = [];

const httpServer = new HttpServer();
httpServer.onRequest('/getChannelList.cgi', async (req, res) => {
    try {
        const url = new URL(req.url, 'http://tmp.com');
        const protocol = url.searchParams.get('protocol');
        const ip = url.searchParams.get('ip');
        const port = parseInt(url.searchParams.get('port'));
        const user = url.searchParams.get('user');
        const pass = url.searchParams.get('pass');

        let channelList: { index: number; name: string }[] = [];
        if (protocol.length && ip.length && !isNaN(port) && user.length && pass.length) {
            const cv = new CameraVapix({
                tls: protocol !== 'http',
                tlsInsecure: protocol === 'https_insecure',
                ip,
                port,
                auth: user + ':' + pass,
            });
            const imageConfigListRes = await cv.getParameterGroup('Image');

            let i = 0;
            while (imageConfigListRes[`root.Image.I${i}.Enabled`] !== undefined) {
                if (imageConfigListRes[`root.Image.I${i}.Enabled`] === 'yes') {
                    channelList.push({ index: i, name: imageConfigListRes[`root.Image.I${i}.Name`] });
                }
                i++;
            }
        }

        res.statusCode = 200;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(channelList));
    } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(err.message);
    }
});

function start() {
    settingsList = readConfiguration();

    settingsList.forEach((settings: HtmlToOverlayOptions) => {
        if (
            settings.imageSettings.url.length &&
            settings.cameraSettings.ip.length &&
            settings.cameraSettings.user.length &&
            settings.cameraSettings.pass.length &&
            settings.coSettings.cameraList.length
        ) {
            const htmlOvl = new HtmlToOverlay(settings);
            htmlOvl.start();
            overlayList.push(htmlOvl);
        }
    });
}

function readConfiguration() {
    try {
        const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        return JSON.parse(data.toString());
    } catch (err) {
        console.log('No configuration found');
        return [];
    }
}

async function stop() {
    settingsList = [];

    overlayList.forEach(async (htmlOverlay) => {
        await htmlOverlay.stop();
    });
    overlayList.splice(0, overlayList.length);
}

process.on('SIGINT', async () => {
    console.log('Reload configuration');
    await stop();
    start();
});

process.on('SIGTERM', () => {
    console.log('App exit');
    process.exit();
});

console.log('App started');
start();
