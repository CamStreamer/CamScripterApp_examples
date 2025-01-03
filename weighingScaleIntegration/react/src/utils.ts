import type { TAppSchema } from './models/schema';
import type { FieldErrors } from 'react-hook-form';

export const getErrorObject = (errorObject: FieldErrors<TAppSchema>, name: keyof TAppSchema) => {
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
            'x-target-camera-user': encodeURIComponent(proxy.user),
            'x-target-camera-pass': encodeURIComponent(proxy.pass),
        },
    });
    const aborter = new AbortController();
    const areValid = fetch(req, { signal: aborter.signal }).then((res) => {
        return res.status === 200;
    });
    return [aborter, areValid];
}

export const checkConnection = (proxy: TWatches): [AbortController, Promise<{ response: boolean; data: unknown }>] => {
    const req = new Request(window.location.origin + '/local/camscripter/proxy.cgi', {
        method: 'POST',
        headers: {
            'x-target-camera-protocol': proxy.protocol,
            'x-target-camera-path': '/axis-cgi/basicdeviceinfo.cgi',
            'x-target-camera-ip': proxy.ip,
            'x-target-camera-port': proxy.port.toString(),
            'x-target-camera-user': encodeURIComponent(proxy.user),
            'x-target-camera-pass': encodeURIComponent(proxy.pass),
        },
        body: JSON.stringify({
            apiVersion: '1.0',
            context: 'Client defined request ID',
            method: 'getAllProperties',
            protocol: proxy.protocol,
            path: '/axis-cgi/basicdeviceinfo.cgi',
            ip: proxy.ip,
            port: proxy.port,
            user: proxy.user,
            pass: proxy.pass,
        }),
    });

    const aborter = new AbortController();
    const cameraResponse = fetch(req, {
        signal: aborter.signal,
    }).then(async (res) => {
        const data = await res.json();
        return { response: res.status === 200, data: data };
    });

    return [aborter, cameraResponse];
};
