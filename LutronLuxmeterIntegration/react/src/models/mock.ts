import { TSettings } from './schema';

export const mockedSettings: TSettings = {
    updateFrequency: 10,
    cameras: [
        {
            protocol: 'http',
            ip: '',
            port: 80,
            user: 'root',
            pass: '',
            cameraList: [0],
        },
    ],
    acs: {
        enabled: false,
        protocol: 'https_insecure',
        ip: '',
        port: 29204,
        user: '',
        pass: '',
        source_key: '',
    },
    events: {
        enabled: false,
    },
    widget: {
        enabled: true,
        scale: 1,
        coAlignment: 'top_left',
        x: 0,
        y: 0,
        screenWidth: 1920,
        screenHeight: 1080,
    },
    lowEvent: {
        enabled: false,
        triggerDelay: 0,
        repeatDelay: 0,
        value: 0,
        condition: '<',
    },
    highEvent: {
        enabled: false,
        triggerDelay: 0,
        repeatDelay: 0,
        value: 400000,
        condition: '>',
    },
};
