import { TSettings } from './schema';

export const mockedSettings: TSettings = {
    started: false,
    camera_protocol: 'http',
    camera_ip: '',
    camera_port: 80,
    camera_user: 'root',
    camera_pass: '',
    coord: 'top_left',
    pos_x: 0,
    pos_y: 0,
    resolution: '1920x1080',
    camera_list: [0],
    group_name: 'default',
    start_time: 'now',
    scale: 100,
    calibration_volume: 0.5,
    overlay_type: 'axis_beer',
};
