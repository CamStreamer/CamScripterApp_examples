import { TSettingsSchema } from './schema';

export const mockedSettings: TSettingsSchema = {
    camera: {
        protocol: 'http',
        ip: '',
        port: 80,
        user: 'root',
        pass: '',
    },
    widget: {
        camera_list: [0],
        coord_system: 'top_left',
        pos_x: 0,
        pos_y: 0,
        scale: 100,
        stream_resolution: '1920x1080',
        start_time: '00:00',
        group_name: 'Group 1',
        overlay_type: 'axis_beer',
        glass_size: 0.3,
    },
};
