import { TServerData } from './schema';

export const mockedSettings: TServerData = {
    luxmeter: { frequency: 10, low: 0, high: Number.MAX_VALUE, period: 0 },
    cameras: [
        {
            protocol: 'http',
            ip: '127.0.0.1',
            port: 80,
            user: 'root',
            pass: '',
        },
    ],
    widget: {
        enabled: true,
        scale: 1,
        coAlignment: 'top_left',
        x: 0,
        y: 0,
        screenWidth: 1920,
        screenHeight: 1080,
    },
    events: {
        enabled: false,
    },
    acs: {
        enabled: false,
        protocol: 'https_insecure',
        ip: '',
        port: 55756,
        user: '',
        pass: '',
        source_key: '',
    },
};
