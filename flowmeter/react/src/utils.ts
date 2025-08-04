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

export const pad = (num: number, size: number) => {
    const sign = Math.sign(num) === -1 ? '-' : '';
    return (
        sign +
        new Array(size)
            .concat([Math.abs(num)])
            .join('0')
            .slice(-size)
    );
};

export type TWatches = {
    protocol: string;
    ip: string;
    port: number;
    user: string;
    pass: string;
};

export function checkConnection(proxy: TWatches): [AbortController, Promise<boolean>] {
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
    const response = fetch(req, { signal: aborter.signal }).then((res) => {
        return res.status === 200;
    });
    return [aborter, response];
}
