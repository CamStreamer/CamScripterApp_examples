import { CamOverlayAPI, CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';

export class CamOverlayIntegration {
    private _camOverlayApiInstances: Map<number, CamOverlayAPI> = new Map();

    constructor(private _options: CamOverlayOptions) {}

    private _initializeCamOverlayApi(serviceID: number) {
        if (!this._camOverlayApiInstances.has(serviceID)) {
            this._camOverlayApiInstances.set(serviceID, new CamOverlayAPI({ ...this._options, serviceID }));
        }
    }

    initializeInfoTickerCamOverlayApi(serviceID: number) {
        this._initializeCamOverlayApi(serviceID);
    }

    initializeCustomGraphicsCamOverlayApi(serviceID: number) {
        this._initializeCamOverlayApi(serviceID);
    }

    async updateInfoTickerText(serviceID: number, text: string) {
        if (!this._camOverlayApiInstances.has(serviceID)) return;
        await this._camOverlayApiInstances.get(serviceID).updateInfoticker(text);
    }

    async updateCustomGraphicsText(serviceID: number, field: string, text: string) {
        if (!this._camOverlayApiInstances.has(serviceID)) return;
        await this._camOverlayApiInstances.get(serviceID).updateCGText([{ field_name: field, text }]);
    }
}
