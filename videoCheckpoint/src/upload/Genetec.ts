import { TServerData } from '../schema';
import { pad } from '../utils';

const ACTION = 'AddCameraBookmark';
const GET_CAMERAS_URL = 'report/EntityConfiguration?q=EntityTypes@Camera';
const GET_CAMERAS_DETAILS_URL = '/entity?q=';
const PARAMS = 'Guid,Name,EntityType';

export class Genetec {
    private baseUrl: string;
    private credentials: string;

    constructor(private genetecSettings: TServerData['genetec']) {
        this.baseUrl = `${genetecSettings.protocol}://${genetecSettings.ip}:${genetecSettings.port}/${genetecSettings.base_uri}`;
        this.credentials = btoa(`${genetecSettings.user};${genetecSettings.app_id}:${genetecSettings.pass}`);
    }

    async sendBookmark(code: string) {
        console.log('Sending bookmark...');
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
            console.log('Bookmark sent');
        } catch (err) {
            throw new Error('Error sending bookmark' + err);
        }
    }

    async getCameraList() {
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
    }

    private async getAllCamerasGuids() {
        const requestOptions = this.requestOptionsCreator('GET');
        return await fetch(`${this.baseUrl}/${GET_CAMERAS_URL}`, requestOptions).then((res) => res.json());
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
