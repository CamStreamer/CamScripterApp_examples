import { TAppSchema } from './schema';

export const mockedSettings: TAppSchema = {
    acs: {
        protocol: 'https_insecure',
        ip: '',
        port: 29204,
        user: '',
        pass: '',
        source_key: '',
        active: true,
        condition_delay: 0,
        condition_operator: 1,
        condition_value: '10',
        repeat_after: 30,
    },
    camera: {
        protocol: 'http',
        ip: '',
        port: 80,
        user: 'root',
        pass: '',
        service_id: 1,
        value_field_name: 'field1',
        unit_field_name: 'field2',
    },
    event_camera: {
        protocol: 'http',
        ip: '',
        port: 80,
        user: 'root',
        pass: '',
        active: true,
        condition_delay: 0,
        condition_operator: 1,
        condition_value: '10',
    },
    scale: {
        ip: '',
        port: 80,
        refresh_rate: 500,
    },
};
