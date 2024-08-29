import { TSettings } from './schema';

export const mockedSettings: TSettings = {
    camera: {
        protocol: 'http',
        ip: '127.0.0.1',
        port: 80,
        user: 'root',
        pass: '',
        serviceID: 1,
        fieldName: '',
    },
    aoa: {
        protocol: 'http',
        ip: '127.0.0.1',
        port: 80,
        user: 'root',
        pass: '',
        updateFrequency: 10,
        scenarioId: 1,
        method: 'getOccupancy',
    },
};
