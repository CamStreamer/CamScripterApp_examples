import { TServerData } from '../schema';
import { pad } from '../utils';

const ACTION = 'AddCameraBookmark';
const GET_CAMERAS_URL = 'report/EntityConfiguration?q=EntityTypes@Camera';
const GET_CAMERAS_DETAILS_URL = '/entity?q=';
const PARAMS = 'Guid,Name,EntityType';

type TCameraOption = {
    index: number;
    value: string;
    label: string;
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
    private fetchedCameraList: { index: number; value: string; label: string }[];

    constructor(private genetecSettings: TServerData['genetec']) {
        this.baseUrl = `${genetecSettings.protocol}://${genetecSettings.ip}:${genetecSettings.port}/${genetecSettings.base_uri}`;
        this.credentials = btoa(`${genetecSettings.user};${genetecSettings.app_id}:${genetecSettings.pass}`);
        this.fetchedCameraList = [];
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
            const baseUrl = `${currentSettings.protocol}://${currentSettings.ip}:${currentSettings.port}/${currentSettings.base_uri}`;
            const credentials = `${currentSettings.credentials}`;

            const isConnected = await this.checkConnectionToGenetec(baseUrl, credentials).then((res) => res.Rsp.Status);

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
        const queryString = req.url.split('?')[1];
        const params = new URLSearchParams(queryString);
        const currentSettings = {
            protocol: params.get('protocol'),
            ip: params.get('ip'),
            port: params.get('port'),
            base_uri: params.get('base_uri'),
            credentials: params.get('credentials'),
            camera_list: params.get('camera_list'),
            selected_cameras: params.get('selected_cameras'),
        };
        const baseUrl = `${currentSettings.protocol}://${currentSettings.ip}:${currentSettings.port}/${currentSettings.base_uri}`;
        const credentials = `${currentSettings.credentials}`;

        try {
            if (currentSettings.camera_list !== null && currentSettings.selected_cameras !== null) {
                res.statusCode = 200;
                res.setHeader('Access-Control-Allow-Origin', '*');

                await this.sendBookmark(
                    'Testing bookmark from CamStreamer script',
                    baseUrl,
                    credentials,
                    currentSettings.camera_list,
                    currentSettings.selected_cameras
                );
                res.end('Test bookmark sent');
            }
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
            console.error('Cannot get camera options, error: ', err);
            res.statusCode = 500;
        }
    }

    async sendBookmark(
        code: string,
        baseUrl?: string,
        credentials?: string,
        currentCameraList?: string,
        currentSelectedCameras?: string
    ) {
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
        const cameraList: TCameraOption[] =
            currentCameraList !== undefined ? JSON.parse(currentCameraList) : this.fetchedCameraList;

        const selectedCameras: number[] =
            currentSelectedCameras !== undefined
                ? JSON.parse(currentSelectedCameras)
                : cameraList.map((camera: TCameraOption) => camera.index);

        const selectedCamerasToSend = cameraList.filter((camera: TCameraOption) =>
            selectedCameras.includes(camera.index)
        );

        const cameraEntitiesUrl: string[] = [];

        for (const camera of selectedCamerasToSend) {
            cameraEntitiesUrl.push(`${ACTION}(${camera.value},${timeStamp},${bookmarkText})`);
        }

        const requestOptions = this.requestOptionsCreator(
            'POST',
            credentials !== undefined ? credentials : this.credentials
        );

        try {
            await fetch(
                `${baseUrl !== undefined ? baseUrl : this.baseUrl}/action?q=${cameraEntitiesUrl.join(',')}`,
                requestOptions
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
                        index: 0,
                        value: camerasDetails.Guid,
                        label: camerasDetails.Name,
                    });
                } else {
                    for (let i = 0; i < camerasDetails.length; i++) {
                        const camera = camerasDetails[i];
                        cameraList.push({
                            index: i,
                            value: camera.Guid,
                            label: camera.Name,
                        });
                    }
                }
                this.fetchedCameraList = cameraList;
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

    private async checkConnectionToGenetec(baseUrl: string, credentials: string) {
        const requestOptions = this.requestOptionsCreator('GET', credentials);
        return fetch(`${baseUrl}/`, requestOptions).then((res) => res.json());
    }

    private requestOptionsCreator(method: string, credentials?: string): RequestInit {
        return {
            method: method,
            headers: new Headers({
                Authorization: `Basic ${credentials !== undefined ? credentials : this.credentials}`,
                Accept: 'text/json',
            }),
            redirect: 'follow' as RequestRedirect,
        };
    }
}
