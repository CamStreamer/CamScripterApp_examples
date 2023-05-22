import { CamOverlayAPI, CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';

export class CamOverlayIntegration {
    private _camOverlayApiInstances: Map<number, CamOverlayAPI> = new Map();

    constructor(private _options: CamOverlayOptions) {}

    private _initializeCamOverlayApi(serviceID: number) {
        if (!this._camOverlayApiInstances.has(serviceID)) {
            this._camOverlayApiInstances.set(serviceID, new CamOverlayAPI({ ...this._options, serviceID }));
        }
    }

    async updateInfoTickerText(serviceID: number | '', text: string) {
        if (serviceID === '') return; // service shut down
        this._initializeCamOverlayApi(serviceID);
        try {
            await this._camOverlayApiInstances.get(serviceID).updateInfoticker(text);
        } catch (e) {
            throw new Error(
                `Error while trying to update infoticker text. ServiceID: ${serviceID}. Check your CamOverlay integration settings. Error: ${e}`
            );
        }
    }

    async updateCustomGraphicsText(serviceID: number | '', field: string, text: string) {
        if (serviceID === '') return; // service shut down
        this._initializeCamOverlayApi(serviceID);
        try {
            await this._camOverlayApiInstances.get(serviceID).updateCGText([{ field_name: field, text }]);
        } catch (e) {
            throw new Error(
                `Error while trying to update custom graphics text. ServiceID: ${serviceID}, field name: ${field}. Check your CamOverlay integration settings. Error: ${e}`
            );
        }
    }
}
