import type { TWidget, TSettings } from './models/schema';
import type { FieldErrors } from 'react-hook-form';

export const getErrorObject = (errorObject: FieldErrors<TSettings>, name: string) => {
    const [name1, name2] = name.split('.') as ['acs', void] | ['cameras', string]; // hack
    if (name1 === 'acs') {
        return errorObject[name1];
    } else {
        return errorObject[name1]?.[Number.parseInt(name2)];
    }
};

export const coordOptionLabels: Record<TWidget['coAlignment'], string> = {
    top_left: 'Top Left',
    top_center: 'Top Center',
    top_right: 'Top Right',
    center_left: 'Center Left',
    center: 'Center',
    center_right: 'Center Right',
    bottom_left: 'Bottom Left',
    bottom_center: 'Bottom Center',
    bottom_right: 'Bottom Right',
};
export const COORD_LIST = Object.keys(coordOptionLabels) as TWidget['coAlignment'][];

export const parseValueAsInt = (value: string) => {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) {
        return value;
    } else {
        return parsedValue;
    }
};

export const parseValueAsFloat = (value: string) => {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
        return value;
    } else {
        return parsedValue;
    }
};

export type TWatches = {
    protocol: string;
    ip: string;
    port: number;
    user: string;
    pass: string;
};
export function validateCredentials(proxy: TWatches): [AbortController, Promise<boolean>] {
    const req = new Request(window.location.origin + '/local/camscripter/proxy.cgi', {
        headers: {
            'x-target-camera-protocol': proxy.protocol,
            'x-target-camera-path': '/axis-cgi/param.cgi',
            'x-target-camera-ip': proxy.ip,
            'x-target-camera-port': proxy.port.toString(),
            'x-target-camera-user': encodeURIComponent(proxy.user),
            'x-target-camera-pass': encodeURIComponent(proxy.pass),
        },
    });
    const aborter = new AbortController();
    const areValid = fetch(req, { signal: aborter.signal }).then((res) => {
        return res.status !== 400;
    });
    return [aborter, areValid];
}
