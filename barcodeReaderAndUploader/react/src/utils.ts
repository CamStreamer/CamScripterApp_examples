import { TFormValues, TServerData } from './form/models/schema';

export const covertFlatFormDataIntoServerData = (data: TFormValues, defaultValues: TFormValues): TServerData => ({
    camera: {
        protocol: data.protocol,
        ip: data.ip,
        port: data.port,
        user: data.user,
        pass: data.pass,
    },
    overlay: {
        alignment: data.alignment,
        height: data.height,
        width: data.width,
        scale: data.scale,
        x: data.x,
        y: data.y,
    },
    storage: {
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        outputDir: data.outputDir,
        tenantId: data.tenantId,
        url: data.url,
        connectionTimeoutS: data.connectionTimeoutS || defaultValues.connectionTimeoutS,
        numberOfRetries: data.numberOfRetries || defaultValues.numberOfRetries,
        uploadTimeoutS: data.uploadTimeoutS || defaultValues.uploadTimeoutS,
    },
    ledSettings: {
        greenPort: data.greenPort,
        redPort: data.redPort,
    },
    barcodeSettings: {
        displayTimeS: data.displayTimeS,
    },
});
