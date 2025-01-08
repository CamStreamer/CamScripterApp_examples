import { JSDOM } from 'jsdom';
import { TServerData } from '../schema';
import { CameraVapix } from 'camstreamerlib/CameraVapix';
import { ReadableStream } from 'stream/web';

export class CameraVideo {
    private cameraVapix: CameraVapix;

    constructor(cameraSettings: TServerData['camera']) {
        this.cameraVapix = this.setCameraVapix(cameraSettings);
    }

    private setCameraVapix(cameraSettings: TServerData['camera']) {
        const options = {
            tls: cameraSettings.protocol !== 'http',
            tlsInsecure: cameraSettings.protocol === 'https_insecure',
            ip: cameraSettings.ip,
            port: cameraSettings.port,
            user: cameraSettings.user,
            pass: cameraSettings.pass,
        };
        return new CameraVapix(options);
    }

    async getIDs(source: number) {
        const path = '/axis-cgi/record/list.cgi';
        const response = await await this.cameraVapix.vapixGet(path, { recordingid: 'all' });
        if (!response.ok) {
            throw new Error(
                `The response from camera was not OK. Status code: ${response.status}. Download cancelled.`
            );
        }
        const xml = await response.text();
        const dom = new JSDOM(xml, { contentType: 'text/xml' });

        const recordingNode = dom.window.document.querySelector(
            'recording[recordingstatus="recording"][source="' + source + '"]'
        );
        if (!recordingNode) {
            throw new Error('Warning: Source ' + source + ' has not been found. Make sure it is currently recording.');
        }

        const diskID = recordingNode.getAttribute('diskid');
        const recordingID = recordingNode.getAttribute('recordingid');

        if (diskID === null || diskID === '' || recordingID === null || recordingID === '') {
            throw new Error('Invalid body from ' + path);
        }
        return [diskID, recordingID];
    }

    async getSchemaVersion() {
        const path = '/axis-cgi/record/storage/schemaversions.cgi';
        const xml = await (await this.cameraVapix.vapixGet(path)).text();

        const dom = new JSDOM(xml, { contentType: 'text/xml' });

        const versionNumberNode = dom.window.document.querySelector('VersionNumber');
        if (!versionNumberNode) {
            throw new Error('VersionNumber element not found at ' + path);
        }

        const versionNumber = versionNumberNode.textContent;
        if (versionNumber === null || versionNumber === '') {
            throw new Error('VersionNumber is empty');
        }

        return versionNumber;
    }

    async downloadRecording(startTime: number, endTime: number, source: number) {
        const ids = await this.getIDs(source + 1);
        if (ids.length === 0) {
            return undefined;
        }
        const [diskID, recordingID] = ids;
        const schemaVersion = await this.getSchemaVersion();

        const path = '/axis-cgi/record/export/exportrecording.cgi';
        const parameters = {
            schemaversion: schemaVersion,
            diskid: diskID,
            recordingid: recordingID,
            exportformat: 'matroska',
            starttime: this.formatDate(startTime),
            endtime: this.formatDate(endTime),
        };

        const video = await this.cameraVapix.vapixGet(path, parameters);

        if (!video.ok) {
            throw new Error('The response was not OK. Status code: ' + video.status);
        }

        /**
         * Response body must be consumed to avoid socket error.
         * https://github.com/nodejs/undici/issues/583#issuecomment-855384858
         */
        const clonedVideo = video.clone();
        return clonedVideo.body as ReadableStream;
    }

    formatDate(startTime: number) {
        const result = new Date(startTime).toISOString();
        return result.substring(0, result.length - 1) + '0Z';
    }
}
