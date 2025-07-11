import { TServerData } from '../schema';
import { GenetecAgent, GenetecAgentOptions, TParams } from 'camstreamerlib/events/GenetecAgent';

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
            base_uri: genetecSettings.base_uri,
            user: genetecSettings.user,
            pass: genetecSettings.pass,
            app_id: genetecSettings.app_id,
        };

        this.agent = new GenetecAgent(this.settings);
        this.cameraList = genetecSettings.camera_list;
    }

    async checkConnection(req: any, res: any) {
        const queryString = req.url.split('?')[1];
        const params = new URLSearchParams(queryString);
        const currentSettings = {
            protocol: params.get('protocol') ?? 'http',
            ip: params.get('ip') ?? '127.0.0.1',
            port: params.get('port') ?? 80,
            base_uri: params.get('base_uri') ?? 'WebSdk',
            user: params.get('user') ?? 'root',
            pass: params.get('pass') ?? '',
            app_id: params.get('app_id') ?? '',
        };

        try {
            const newAgent = new GenetecAgent(currentSettings as GenetecAgentOptions);
            const isConnected = await newAgent.checkConnection().then((res) => res.Rsp.Status);

            console.log('Connection to Genetec successful');
            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(
                isConnected === 'Ok'
                    ? '{"message": "Genetec connection success"}'
                    : '{"message": "Genetec connection unsuccessful"}'
            );
        } catch (err) {
            console.error('Cannot connect to Genetec, error:', err);
            res.statusCode = 500;
            res.end('{"message": "Genetec connection error"}');
        }
    }

    async sendTestBookmark(req: any, res: any) {
        const queryString = req.url.split('?')[1];
        const params = new URLSearchParams(queryString);
        const currentSettings = {
            protocol: params.get('protocol') ?? 'http',
            ip: params.get('ip') ?? '127.0.0.1',
            port: params.get('port') ?? 80,
            base_uri: params.get('base_uri') ?? 'WebSdk',
            user: params.get('user') ?? 'root',
            pass: params.get('pass') ?? '',
            app_id: params.get('app_id') ?? '',
        };
        const selectedCameras = params.get('selected_cameras');

        try {
            if (selectedCameras !== null) {
                const newAgent = new GenetecAgent(currentSettings as GenetecAgentOptions);

                await this.sendBookmark(
                    'Testing bookmark from CamStreamer script',
                    newAgent,
                    JSON.parse(selectedCameras)
                );

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

    async getCameraOptions(req: any, res: any) {
        const queryString = req.url.split('?')[1];
        const params = new URLSearchParams(queryString);
        const currentSettings = {
            protocol: params.get('protocol') ?? 'http',
            ip: params.get('ip') ?? '127.0.0.1',
            port: params.get('port') ?? 80,
            base_uri: params.get('base_uri') ?? 'WebSdk',
            user: params.get('user') ?? 'root',
            pass: params.get('pass') ?? '',
            app_id: params.get('app_id') ?? '',
        };

        try {
            const newAgent = new GenetecAgent(currentSettings as GenetecAgentOptions);
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
}
