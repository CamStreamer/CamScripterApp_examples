import type { TSettings } from './models/schema';
import type { FieldErrors } from 'react-hook-form';

export const getErrorObject = (errorObject: FieldErrors<TSettings>, name: 'camera' | 'application') => {
    return errorObject[name];
};

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
            'x-target-camera-user': proxy.user,
            'x-target-camera-pass': proxy.pass,
        },
    });
    const aborter = new AbortController();
    const areValid = fetch(req, { signal: aborter.signal }).then((res) => {
        return res.status !== 400;
    });
    return [aborter, areValid];
}
