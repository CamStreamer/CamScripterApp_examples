import { TSettings } from './schema';

export const mockedSettings: TSettings = {
    //adjust application accodingly
    camera: {
        protocol: 'http',
        ip: '127.0.0.1',
        port: 80,
        user: 'root',
        pass: '',
        update_frequency: 0,
        port_id: '1',
    },
    output_camera: {
        protocol: 'http',
        ip: '127.0.0.1',
        port: 80,
        user: 'root',
        pass: '',
        field_name: '1',
        service_id: '1',
    },
};
