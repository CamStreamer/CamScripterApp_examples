import { TServerData } from './schema';

export const mockedSettings: TServerData = {
    source_camera: {
        protocol: 'http',
        ip: '',
        port: 80,
        user: 'root',
        pass: '',
    },
    output_camera: {
        protocol: 'http',
        ip: '',
        port: 80,
        user: 'root',
        pass: '',
    },
    widget: {
        scale: 100,
        coord_system: 'top_left',
        pos_x: 0,
        pos_y: 0,
        stream_resolution: '1920x1080',
        camera_list: [0],
        units: 'metric',
    },
};
