import { CamOverlayAPI, CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';

export class CamOverlayIntegration {
    private _camOverlayApi: CamOverlayAPI;

    constructor(private _options: CamOverlayOptions) {
        this._camOverlayApi = new CamOverlayAPI({ ...this._options });
    }

    async updateCustomGraphicsFieldTextInAllServices(serviceIDs: number[], fieldName: string, text: string) {
        const fieldData = [
            {
                field_name: fieldName,
                text,
            },
        ];

        const promiseArr = serviceIDs.map((serviceID) => this._camOverlayApi.updateCGText(serviceID, fieldData));

        try {
            await Promise.allSettled(promiseArr);
        } catch (e) {
            console.error(`Error while trying to update custom graphics text. Error: ${e}`);
        }
    }
}
