import { CamOverlayAPI, CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';

export class CamOverlayIntegration {
    private _camOverlayApiInstances: Map<number, CamOverlayAPI> = new Map();

    constructor(private _options: CamOverlayOptions) {}

    private _initializeCamOverlayApi(serviceID: number) {
        if (!this._camOverlayApiInstances.has(this._options.serviceID)) {
            this._camOverlayApiInstances.set(
                this._options.serviceID,
                new CamOverlayAPI({ ...this._options, serviceID })
            );
        }
    }

    initializeInfoTickerCamOverlayApi(serviceID: number) {
        this._initializeCamOverlayApi(serviceID);
    }

    nitializeCustomGraphicsCamOverlayApi(serviceID: number) {
        this._initializeCamOverlayApi(serviceID);
    }

    async updateInfoTickerText(serviceID: number, text: string) {
        if (!this._camOverlayApiInstances.has(this._options.serviceID)) {
            console.log(`Infoticker with service id: ${serviceID} does not exist`);
            return;
        }
        try {
            await this._camOverlayApiInstances.get(serviceID).updateInfoticker(text);
        } catch (e) {
            console.error(`Could not update infoticker service text. Service id: ${serviceID}. Error: `, e);
        }
    }

    async updateCustomGraphicsText(serviceID: number, field: string, text: string) {
        if (!this._camOverlayApiInstances.has(this._options.serviceID)) {
            console.log(`Custom graphics with service id: ${serviceID} does not exist`);
            return;
        }
        try {
            await this._camOverlayApiInstances.get(serviceID).updateCGText([{ field_name: field, text }]);
        } catch (e) {
            console.error(`Could not update custom graphics service text. Service id: ${serviceID}. Error: `, e);
        }
    }
}
