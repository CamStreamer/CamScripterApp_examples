import { CamOverlayAPI, CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';

export class CamOverlayIntegration {
    private _camOverlayApi: CamOverlayAPI;

    constructor(private _options: CamOverlayOptions) {
        this._camOverlayApi = new CamOverlayAPI({ ...this._options });
    }

    async updateCustomGraphicsFieldTextInAllServices(serviceID: number, fieldName: string, text: string) {
        const fieldData = [
            {
                field_name: fieldName,
                text,
            },
        ];

        try {
            await this._camOverlayApi.updateCGText(serviceID, fieldData);
        } catch (e) {
            console.error(`Error while trying to update custom graphics text. Error: ${e}`);
        }
    }
}
