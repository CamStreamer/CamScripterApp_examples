import { TServerData } from '../schema';
import { GenetecAgent, GenetecAgentOptions } from 'camstreamerlib/events/GenetecAgent';

type TParams = Array<'Guid' | 'Name' | 'EntityType'>;

type TCameraOption = {
    index: number;
    value: string;
    label: string;
};

const PARAMS: TParams = ['Guid', 'Name', 'EntityType'];

export class Genetec {
    private agent: GenetecAgent;
    private settings: GenetecAgentOptions;

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

        console.log('currentSettings:', currentSettings);

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
        const currentCameraOptions = {
            camera_list: params.get('camera_list'),
            selected_cameras: params.get('selected_cameras'),
        };

        try {
            if (currentCameraOptions.camera_list !== null && currentCameraOptions.selected_cameras !== null) {
                const newAgent = new GenetecAgent(currentSettings as GenetecAgentOptions);

                await this.sendBookmark(
                    'Testing bookmark from CamStreamer script',
                    newAgent,
                    JSON.parse(currentCameraOptions.camera_list),
                    JSON.parse(currentCameraOptions.selected_cameras)
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

    async sendBookmark(
        code: string,
        newAgent?: GenetecAgent,
        currentCameraList?: TCameraOption[],
        currentSelectedCameras?: number[]
    ) {
        const genetecAgent = newAgent ?? this.agent;
        console.log('Sending bookmark... ', code);
        try {
            if (currentCameraList === undefined) {
                currentCameraList = await this.getCameraList();
            }
            if (currentSelectedCameras === undefined) {
                currentSelectedCameras = this.genetecSettings.camera_list;
            }

            const selectedCamerasToSend = currentCameraList
                .filter((camera: TCameraOption) => currentSelectedCameras?.includes(camera.index))
                .map((camera) => camera.value);

            await genetecAgent.sendBookmark(selectedCamerasToSend, code);
            console.log('Bookmark sent: ', code);
        } catch (err) {
            console.error('Cannot send bookmark, error: ', err);
        }
    }

    private async getCameraList(newAgent?: GenetecAgent) {
        const genetecAgent = newAgent ?? this.agent;

        const guidsArray = await genetecAgent.getAllCameraGuids().then((res) => res.Rsp.Result);
        const camerasDetails = await genetecAgent.getCameraDetails(guidsArray, PARAMS).then((res) => res.Rsp.Result);

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
