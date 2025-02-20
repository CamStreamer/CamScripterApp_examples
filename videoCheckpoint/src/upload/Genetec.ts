import { TServerData } from '../schema';
import { pad } from '../utils';

const ACTION = 'AddCameraBookmark';
const GET_CAMERAS_URL = 'report/EntityConfiguration?q=EntityTypes@Camera';
const GET_CAMERAS_DETAILS_URL = '/entity?q=';
const PARAMS = 'Guid,Name,EntityType';

type TGenetec = {
    protocol: string;
    ip: string;
    port: string;
    base_uri: string;
    user: string;
    pass: string;
    app_id: string;
};

type TGenetecParams = {
    protocol: string | null;
    ip: string | null;
    port: string | null;
    base_uri: string | null;
    credentials: string | null;
};

export class Genetec {
    private baseUrl: string;
    private credentials: string;

    constructor(private genetecSettings: TServerData['genetec']) {
        this.baseUrl = `${genetecSettings.protocol}://${genetecSettings.ip}:${genetecSettings.port}/${genetecSettings.base_uri}`;
        this.credentials = btoa(`${genetecSettings.user};${genetecSettings.app_id}:${genetecSettings.pass}`);
    }

    async checkConnection(req: any, res: any) {
        console.log('Checking connection to Genetec...');
        try {
            const queryString = req.url.split('?')[1];
            const params = new URLSearchParams(queryString);
            const currentSettings = {
                protocol: params.get('protocol'),
                ip: params.get('ip'),
                port: params.get('port'),
                base_uri: params.get('base_uri'),
                credentials: params.get('credentials'),
            };

            console.log('Current settings:', currentSettings);

            const isConnected = await this.checkConnectionToGenetec().then((res) => res.Rsp.Status);
            console.log('Connection status:', isConnected);
            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(isConnected === 'Ok' ? 'true' : 'false');
        } catch (err) {
            console.error('Cannot connect to Genetec, error:', err);
            res.statusCode = 500;
            res.end('false');
        }
    }

    async sendTestBookmark(req: any, res: any) {
        try {
            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', '*');
            const currentSettings = req.body;
            const result = await this.sendBookmark('Testing%bookmark%from%CamStreamer%script', currentSettings);
            res.end('Test bookmark sent');
        } catch (err) {
            console.error('Cannot send test bookmark, error:', err);
            res.statusCode = 500;
            res.end('Cannot send test bookmark');
        }
    }

    async getCameraOptions(req: any, res: any) {
        console.log('Fetching camera list...');
        try {
            const queryString = req.url.split('?')[1];
            const params = new URLSearchParams(queryString);
            const currentSettings = {
                protocol: params.get('protocol'),
                ip: params.get('ip'),
                port: params.get('port'),
                base_uri: params.get('base_uri'),
                credentials: params.get('credentials'),
            };

            const cameraList = await this.getCameraList(currentSettings);
            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(cameraList));
        } catch (err) {
            console.error('Cannot connect to Genetec, error:', err);
            res.statusCode = 500;
        }
    }

    async sendBookmark(code: string, currentSettings?: TGenetec) {
        if (currentSettings !== undefined) {
            this.baseUrl = `${currentSettings.protocol}://${currentSettings.ip}:${currentSettings.port}/${currentSettings.base_uri}`;
            this.credentials = btoa(`${currentSettings.user};${currentSettings.app_id}:${currentSettings.pass}`);
        }

        console.log('Sending bookmark... ', code);

        const date = new Date();
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1, 2);
        const day = pad(date.getUTCDate(), 2);
        const hours = pad(date.getUTCHours(), 2);
        const minutes = pad(date.getUTCMinutes(), 2);
        const seconds = pad(date.getUTCSeconds(), 2);
        const miliSeconds = pad(date.getUTCMilliseconds(), 2);

        const timeStamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${miliSeconds}Z`;
        const bookmarkText = code;
        const cameraEntitiesUrl = [];

        for (const camera of this.genetecSettings.camera_list) {
            cameraEntitiesUrl.push(`${ACTION}(${camera},${timeStamp},${bookmarkText})`);
        }

        const requestOptions = this.requestOptionsCreator('POST');

        try {
            fetch(`${this.baseUrl}/action?q=${cameraEntitiesUrl.join(',')}`, requestOptions).catch((error) =>
                console.error(error)
            );
            console.log('Bookmark sent: ', code);
        } catch (err) {
            console.error('Cannot send bookmark, error:', err);
        }
    }

    private async getCameraList(currentSettings?: TGenetecParams) {
        if (currentSettings !== undefined && currentSettings.credentials !== null) {
            this.baseUrl = `${currentSettings.protocol}://${currentSettings.ip}:${currentSettings.port}/${currentSettings.base_uri}`;
            this.credentials = currentSettings.credentials;

            try {
                const guidsArray = await this.getAllCamerasGuids().then((res) => res.Rsp.Result);
                const camerasGuids = guidsArray.map((guid: { Guid: string }) => guid.Guid);
                const camerasDetailsUrl = [];

                for (const guid of camerasGuids) {
                    camerasDetailsUrl.push(`entity=${guid},${PARAMS}`);
                }

                const requestOptions = this.requestOptionsCreator('GET');

                const camerasDetails = await fetch(
                    `${this.baseUrl}/${GET_CAMERAS_DETAILS_URL}${camerasDetailsUrl.join(',')}`,
                    requestOptions
                )
                    .then((res) => res.json())
                    .then((response) => response.Rsp.Result)
                    .catch((error) => {
                        console.error(error);
                    });

                const cameraList = [];

                if (!Array.isArray(camerasDetails)) {
                    cameraList.push({
                        value: camerasDetails.Guid,
                        label: camerasDetails.Name,
                    });
                } else {
                    for (const camera of camerasDetails) {
                        cameraList.push({
                            value: camera.Guid,
                            label: camera.Name,
                        });
                    }
                }
                console.log('Camera list:', cameraList);
                return cameraList;
            } catch (e) {
                console.error(e);
                return [];
            }
        } else {
            return [];
        }
    }

    private async getAllCamerasGuids() {
        const requestOptions = this.requestOptionsCreator('GET');
        return await fetch(`${this.baseUrl}/${GET_CAMERAS_URL}`, requestOptions).then((res) => res.json());
    }

    private async checkConnectionToGenetec() {
        const requestOptions = this.requestOptionsCreator('GET');
        return fetch(`${this.baseUrl}/`, requestOptions).then((res) => res.json());
    }

    private requestOptionsCreator(method: string): RequestInit {
        return {
            method: method,
            headers: new Headers({
                Authorization: `Basic ${this.credentials}`,
                Accept: 'text/json',
            }),
            redirect: 'follow' as RequestRedirect,
        };
    }
}
