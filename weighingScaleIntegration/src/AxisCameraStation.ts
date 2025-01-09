import * as https from 'https';
import * as http from 'http';
import { TAppSchema } from './schema';
import { pad } from './utils';

export class AxisCameraStation {
    constructor(private acsSettings: TAppSchema['acs']) {}

    sendEvent(weight: string, unit: string) {
        return new Promise<void>((resolve, reject) => {
            const date = new Date();
            const year = date.getUTCFullYear();
            const month = pad(date.getUTCMonth() + 1, 2);
            const day = pad(date.getUTCDate(), 2);
            const hours = pad(date.getUTCHours(), 2);
            const minutes = pad(date.getUTCMinutes(), 2);
            const seconds = pad(date.getUTCSeconds(), 2);
            const dateString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            const event = {
                addExternalDataRequest: {
                    occurrenceTime: dateString,
                    source: this.acsSettings.source_key,
                    externalDataType: 'WeighingScaleIntegration',
                    data: {
                        timestamp: (Date.now() / 1000).toString(),
                        weight: weight,
                        unit,
                    },
                },
            };
            const eventData = JSON.stringify(event);
            const client = this.acsSettings.protocol === 'http' ? http : https;
            const req = client.request(
                {
                    method: 'POST',
                    host: this.acsSettings.ip,
                    port: this.acsSettings.port,
                    path: '/Acs/Api/ExternalDataFacade/AddExternalData',
                    auth: this.acsSettings.user + ':' + this.acsSettings.pass,
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': eventData.length,
                    },
                    rejectUnauthorized: this.acsSettings.protocol !== 'https_insecure',
                    timeout: 10000,
                },
                (res) => {
                    if (res.statusCode === 200) {
                        resolve();
                    } else {
                        reject(new Error(`ACS status code: ${res.statusCode}`));
                    }
                }
            );
            req.on('timeout', () => {
                reject(new Error('ACS connection timeout'));
                req.destroy();
            });
            req.on('error', reject);
            req.write(eventData);
            req.end();
        });
    }
}
