import { TSettings } from './schema';

export const mockedSettings: TSettings = {
    camera: {
        protocol: 'http',
        ip: '',
        port: 80,
        user: 'root',
        pass: '',
        serviceID: 1,
        fieldName: '',
    },
    aoa: {
        updateFrequency: 10,
        scenarioId: '',
        method: 'getOccupancy',
    },
};
