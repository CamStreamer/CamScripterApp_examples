import { CamOverlayAPI, CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';

const camOverlayInstances: Map<number, CamOverlayAPI> = new Map();

export const initializeCamOverlay = (options: CamOverlayOptions) => {
    if (!camOverlayInstances.has(options.serviceID)) {
        camOverlayInstances.set(options.serviceID, new CamOverlayAPI(options));
    }
};

export const updateInfoTickerText = async (itServiceId: number, text: string) =>
    camOverlayInstances.get(itServiceId)?.updateInfoticker(text);

export const updateCustomGraphicsText = async (cgServiceId: number, text: string, cgFieldName: string) =>
    camOverlayInstances.get(cgServiceId)?.updateCGText([{ field_name: cgFieldName, text }]);
