import { JSDOM } from 'jsdom';
import { TServerData } from '../schema';
import { DefaultClient } from 'camstreamerlib/cjs/node';
import { getCameraOptions, isWebReadableStream } from '../utils';

// The camera can take longer than the 10s default to answer while it is busy recording/exporting/uploading.
const CAMERA_BUSY_TIMEOUT_MS = 20 * 1000;

// An unread body keeps its socket checked out of the undici pool, so we must cancel explicitly.
const discardBody = async (response: Awaited<ReturnType<DefaultClient['get']>>) => {
    try {
        await response.body?.cancel();
    } catch {
        // We are already abandoning this response; a failed cancel must not mask the real error.
    }
};

export type TExportRequest = {
    source: number;
    parameters: Record<string, string>;
};

export class CameraVideo {
    private client: DefaultClient;
    private schemaVersion?: string;

    constructor(cameraSettings: TServerData['camera']) {
        this.client = new DefaultClient(getCameraOptions(cameraSettings));
    }

    async getIDs(source: number) {
        const path = '/axis-cgi/record/list.cgi';
        const response = await this.client.get({
            path,
            parameters: { recordingid: 'all' },
            timeout: CAMERA_BUSY_TIMEOUT_MS,
        });
        if (!response.ok) {
            await discardBody(response);
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
        if (this.schemaVersion !== undefined) {
            return this.schemaVersion;
        }
        const path = '/axis-cgi/record/storage/schemaversions.cgi';
        const response = await this.client.get({ path, timeout: CAMERA_BUSY_TIMEOUT_MS });
        if (!response.ok) {
            await discardBody(response);
            throw new Error(`The response from camera was not OK. Status code: ${response.status}`);
        }
        const xml = await response.text();

        const dom = new JSDOM(xml, { contentType: 'text/xml' });

        const versionNumberNode = dom.window.document.querySelector('VersionNumber');
        if (!versionNumberNode) {
            throw new Error('VersionNumber element not found at ' + path);
        }

        const versionNumber = versionNumberNode.textContent;
        if (versionNumber === null || versionNumber === '') {
            throw new Error('VersionNumber is empty');
        }

        this.schemaVersion = versionNumber;
        return versionNumber;
    }

    async prepareExport(startTime: number, endTime: number, source: number): Promise<TExportRequest> {
        const [diskID, recordingID] = await this.getIDs(source + 1);
        const schemaVersion = await this.getSchemaVersion();

        return {
            source,
            parameters: {
                schemaversion: schemaVersion,
                diskid: diskID,
                recordingid: recordingID,
                exportformat: 'matroska',
                starttime: this.formatDate(startTime),
                stoptime: this.formatDate(endTime),
            },
        };
    }

    async openExport(request: TExportRequest) {
        const response = await this.client.get({
            path: '/axis-cgi/record/export/exportrecording.cgi',
            parameters: request.parameters,
            timeout: 30 * 60 * 1000, // Streaming through FTP can take a long time
        });
        if (!response.ok) {
            await discardBody(response);
            throw new Error(`Export of source ${request.source + 1} failed with status ${response.status}`);
        }
        if (!isWebReadableStream(response.body)) {
            throw new Error(`Export of source ${request.source + 1} returned no body`);
        }
        return response.body;
    }

    formatDate(startTime: number) {
        const result = new Date(startTime).toISOString();
        return result.substring(0, result.length - 1) + '0Z';
    }
}
