import { IncomingMessage, ServerResponse } from 'http';
import { TServerData } from '../schema';
import { GenetecAgent, GenetecAgentOptions, TParams } from 'camstreamerlib/cjs/node';

const PARAMS: TParams = ['Guid', 'Name', 'EntityType'];

export class Genetec {
    private agent: GenetecAgent;
    private settings: GenetecAgentOptions;
    private cameraList: string[] = [];

    constructor(private genetecSettings: TServerData['genetec']) {
        this.settings = {
            protocol: genetecSettings.protocol,
            ip: genetecSettings.ip,
            port: genetecSettings.port,
            baseUri: genetecSettings.base_uri,
            user: genetecSettings.user,
            pass: genetecSettings.pass,
            appId: genetecSettings.app_id,
        };

        this.agent = new GenetecAgent(this.settings);
        this.cameraList = genetecSettings.camera_list;
    }

    async checkConnection(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
        const queryString = req.url?.split('?')[1];
        const currentSettings = this.getGenetecSettings(queryString);

        try {
            const newAgent = new GenetecAgent(currentSettings);
            await newAgent.checkConnection();

            console.log('Connection to Genetec successful');
            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end('{"message": "Genetec connection success"}');
        } catch (err) {
            console.error('Cannot connect to Genetec, error:', err);
            res.statusCode = 500;
            res.end('{"message": "Genetec connection error"}');
        }
    }

    async sendTestBookmark(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
        const queryString = req.url?.split('?')[1];
        const params = new URLSearchParams(queryString);
        const currentSettings = this.getGenetecSettings(queryString);

        const selectedCameras = params.get('camera_list');

        try {
            if (selectedCameras !== null) {
                const newAgent = new GenetecAgent(currentSettings);
                await newAgent.sendBookmark(selectedCameras.split(','), 'Testing bookmark from CamStreamer script');

                res.statusCode = 200;
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end('{"message": "Test bookmark sent"}');
            }
        } catch (err) {
            console.error('Cannot send test bookmark, error:', err);
            res.statusCode = 500;
            res.end('{"message": "Cannot send test bookmark"}');
        }
    }

    async getCameraOptions(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
        const queryString = req.url?.split('?')[1];
        const currentSettings = this.getGenetecSettings(queryString);

        try {
            const newAgent = new GenetecAgent(currentSettings);
            const cameraList = await this.getCameraList(newAgent);

            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(cameraList));
        } catch (err) {
            res.statusCode = 500;
            res.end('[]');
        }
    }

    async sendBookmark(code: string, newAgent?: GenetecAgent, currentSelectedCameras?: string[]) {
        const genetecAgent = newAgent ?? this.agent;
        console.log('Sending bookmark... ', code);
        try {
            let selectedCameras = this.cameraList;
            if (currentSelectedCameras !== undefined) {
                selectedCameras = currentSelectedCameras;
            }

            await genetecAgent.sendBookmark(selectedCameras, code);
            console.log('Bookmark sent: ', code);
        } catch (err) {
            console.error('Cannot send bookmark, error: ', err);
        }
    }

    private async getCameraList(newAgent?: GenetecAgent) {
        const genetecAgent = newAgent ?? this.agent;

        const guidsArray = await genetecAgent.getAllCameraGuids().then((res) => res.Rsp.Result);
        const camerasDetails = await genetecAgent.getCameraDetails(guidsArray, PARAMS);

        const cameraList = [];

        for (let i = 0; i < camerasDetails.length; i++) {
            const camera = camerasDetails[i];
            cameraList.push({
                index: i,
                value: camera.Guid ?? '',
                label: camera.Name ?? '',
            });
        }

        return cameraList;
    }

    private getGenetecSettings(queryString: string | undefined): GenetecAgentOptions {
        const params = new URLSearchParams(queryString);

        const protocolParam = params.get('protocol');
        let protocol: GenetecAgentOptions['protocol'];

        if (!this.isValidProtocol(protocolParam)) {
            throw new Error('Invalid protocol specified.');
        } else if (this.isValidProtocol(protocolParam)) {
            protocol = protocolParam;
        }

        const currentSettings: GenetecAgentOptions = {
            protocol: protocol ?? 'http',
            ip: params.get('ip') ?? '127.0.0.1',
            port: parseInt(params.get('port') ?? '80'),
            baseUri: params.get('baseUri') ?? 'WebSdk',
            user: params.get('user') ?? 'root',
            pass: params.get('pass') ?? '',
            appId: params.get('appId') ?? '',
        };

        return currentSettings;
    }

    private isValidProtocol(protocol: string | null): protocol is 'http' | 'https' | 'https_insecure' {
        return protocol === 'http' || protocol === 'https' || protocol === 'https_insecure';
    }
}
