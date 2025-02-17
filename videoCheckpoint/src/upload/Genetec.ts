import { TServerData } from '../schema';
import { pad } from '../utils';

const ACTION = 'AddCameraBookmark';

export class Genetec {
    // 'action?q=AddCameraBookmark'
    private baseUrl: string;
    private credentials: string;

    constructor(private genetecSettings: TServerData['genetec']) {
        this.baseUrl = `${genetecSettings.protocol}://${genetecSettings.ip}:${genetecSettings.port}/${genetecSettings.base_uri}/action?q=`;
        this.credentials = `${genetecSettings.user};${genetecSettings.app_id}:${genetecSettings.pass}`;
    }

    sendBookmark(code: string) {
        const date = new Date();
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1, 2);
        const day = pad(date.getUTCDate(), 2);
        const hours = pad(date.getUTCHours(), 2);
        const minutes = pad(date.getUTCMinutes(), 2);
        const seconds = pad(date.getUTCSeconds(), 2);
        const miliSeconds = pad(date.getUTCMilliseconds(), 2);

        const timeStamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${miliSeconds}Z`;
        const encodedCredentials = btoa(this.credentials);
        const bookmarkText = code;
        const cameraEntitiesUrl = [];

        for (const camera of this.genetecSettings.camera_list) {
            cameraEntitiesUrl.push(`${ACTION}(${camera},${timeStamp},${bookmarkText})`);
        }

        console.log('cameraEntitiesUrl', cameraEntitiesUrl);

        const requestOptions: RequestInit = {
            method: 'POST',
            headers: {
                Authorization: `Basic ${encodedCredentials}`,
                Accept: 'text/json',
            },
            redirect: 'follow' as RequestRedirect,
        };

        console.log(`${this.baseUrl}${cameraEntitiesUrl.join(',')}`);

        try {
            fetch(`${this.baseUrl}${cameraEntitiesUrl.join(',')}`, requestOptions).catch((error) =>
                console.error(error)
            );
        } catch (err) {
            throw new Error('Error sending bookmark' + err);
        }
    }
}
