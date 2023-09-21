import { CamOverlayAPI, CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';

export class CamOverlayIntegration {
    private _camOverlayApi: CamOverlayAPI;

    constructor(private _options: CamOverlayOptions) {
        this._camOverlayApi = new CamOverlayAPI({ ...this._options });
    }

    async updateCustomGraphicsText(serviceID: number | '', fields: string[], text: string) {
        if (serviceID === '') return; // service shut down

        const fieldData = fields.map((field) => ({
            field_name: field,
            text,
        }));

        try {
            await this._camOverlayApi.updateCGText(serviceID, fieldData);
        } catch (e) {
            console.error(`Error while trying to update custom graphics text. ServiceID: ${serviceID}. Error: ${e}`);
        }
    }
}
