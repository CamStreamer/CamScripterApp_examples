import { TServerData } from '../schema';
import { pad, generateUrl, TProxy } from '../utils';

const ACTION = 'AddCameraBookmark';
const GET_CAMERAS_URL = 'report/EntityConfiguration?q=EntityTypes@Camera';
const GET_CAMERAS_DETAILS_URL = '/entity?q=';
const PARAMS = 'Guid,Name,EntityType';

type TCameraOption = {
    index: number;
    value: string;
    label: string;
};

export class Genetec {
    private baseUrl: string;
    private credentials: string;

    constructor(private genetecSettings: TServerData['genetec']) {
        this.baseUrl = generateUrl(genetecSettings);
        this.credentials = btoa(`${genetecSettings.user};${genetecSettings.app_id}:${genetecSettings.pass}`);
    }

    async checkConnection(req: any, res: any) {
        console.log('Checking connection to Genetec...');
        const queryString = req.url.split('?')[1];
        const params = new URLSearchParams(queryString);
        const currentSettings = {
            protocol: params.get('protocol'),
            ip: params.get('ip'),
            port: params.get('port'),
            base_uri: params.get('base_uri'),
            credentials: params.get('credentials'),
        };
        const baseUrl = generateUrl(currentSettings);
        const credentials = `${currentSettings.credentials}`;

        try {
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
        const baseUrl = generateUrl(currentSettings);
        const credentials = `${currentSettings.credentials}`;

        try {
            if (currentSettings.camera_list !== null && currentSettings.selected_cameras !== null) {
                res.statusCode = 200;
                res.setHeader('Access-Control-Allow-Origin', '*');

                await this.sendBookmark(
                    'Testing bookmark from CamStreamer script',
                    baseUrl,
                    credentials,
                    JSON.parse(currentSettings.camera_list),
                    JSON.parse(currentSettings.selected_cameras)
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
        const queryString = req.url.split('?')[1];
        const params = new URLSearchParams(queryString);
        const currentSettings = {
            protocol: params.get('protocol'),
            ip: params.get('ip'),
            port: params.get('port'),
            base_uri: params.get('base_uri'),
            credentials: params.get('credentials'),
        };
        const baseUrl = generateUrl(currentSettings);
        const credentials = `${currentSettings.credentials}`;

        try {
            const cameraList = await this.getCameraList(baseUrl, credentials);
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
        currentCameraList?: TCameraOption[],
        currentSelectedCameras?: number[]
    ) {
        console.log('Sending bookmark... ', code);

        if (baseUrl === undefined) {
            baseUrl = this.baseUrl;
        }
        if (credentials === undefined) {
            credentials = this.credentials;
        }
        if (currentCameraList === undefined) {
            currentCameraList = await this.getCameraList(baseUrl, credentials);
        }
        if (currentSelectedCameras === undefined) {
            currentSelectedCameras = this.genetecSettings.camera_list;
        }

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

        const selectedCamerasToSend = currentCameraList.filter((camera: TCameraOption) =>
            currentSelectedCameras?.includes(camera.index)
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

    private async getCameraList(baseUrl: string, credentials: string) {
        try {
            const guidsArray = await this.getAllCamerasGuids(baseUrl, credentials).then((res) => res.Rsp.Result);
            const camerasGuids = guidsArray.map((guid: { Guid: string }) => guid.Guid);
            const camerasDetailsUrl = [];

            for (const guid of camerasGuids) {
                camerasDetailsUrl.push(`entity=${guid},${PARAMS}`);
            }

            const requestOptions = this.requestOptionsCreator('GET', credentials);

            const camerasDetails = await fetch(
                `${baseUrl}/${GET_CAMERAS_DETAILS_URL}${camerasDetailsUrl.join(',')}`,
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
            return cameraList;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    private async getAllCamerasGuids(baseUrl: string, credentials: string) {
        const requestOptions = this.requestOptionsCreator('GET', credentials);
        return await fetch(`${baseUrl}/${GET_CAMERAS_URL}`, requestOptions).then((res) => res.json());
    }

    private async checkConnectionToGenetec(baseUrl: string, credentials: string) {
        const requestOptions = this.requestOptionsCreator('GET', credentials);
        return fetch(`${baseUrl}/`, requestOptions).then((res) => res.json());
    }

    private requestOptionsCreator(method: string, credentials: string): RequestInit {
        return {
            method: method,
            headers: new Headers({
                Authorization: `Basic ${credentials}`,
                Accept: 'text/json',
            }),
            redirect: 'follow' as RequestRedirect,
        };
    }
}
