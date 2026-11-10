import { ReadableStream } from 'stream/web';
import { TServerData } from './schema';
import { HttpOptions } from 'camstreamerlib/cjs';

// Undici types a response body as its own ReadableStream, structurally incompatible with the
// stream/web one Readable.fromWeb() demands, even though both are the same runtime constructor.
export const isWebReadableStream = (value: unknown): value is ReadableStream<Uint8Array> =>
    value instanceof ReadableStream;

export function pad(num: number, size: number) {
    const sign = Math.sign(num) === -1 ? '-' : '';
    return (
        sign +
        new Array(size)
            .concat([Math.abs(num)])
            .join('0')
            .slice(-size)
    );
}

export function getDate() {
    const d = new Date();
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
    const dateTime = `${date}_${pad(d.getHours(), 2)}-${pad(d.getMinutes(), 2)}-${pad(d.getSeconds(), 2)}`;
    return { date, dateTime };
}

export function stripCode(code: string) {
    return code.replace(/[^\w\s]/gi, '');
}

export function createFileName(code: string, date: Date, serialNumber: string, camera?: number) {
    if (camera !== undefined) {
        const channelNumber = camera + 1;
        return (
            date.getFullYear() +
            '-' +
            pad(date.getMonth() + 1, 2) +
            '-' +
            pad(date.getDate(), 2) +
            '_' +
            pad(date.getHours(), 2) +
            '-' +
            pad(date.getMinutes(), 2) +
            '-' +
            pad(date.getSeconds(), 2) +
            '_' +
            code +
            '_' +
            serialNumber +
            '_camera' +
            channelNumber
        );
    } else {
        return (
            date.getFullYear() +
            '-' +
            pad(date.getMonth() + 1, 2) +
            '-' +
            pad(date.getDate(), 2) +
            '_' +
            pad(date.getHours(), 2) +
            '-' +
            pad(date.getMinutes(), 2) +
            '-' +
            pad(date.getSeconds(), 2) +
            '_' +
            code +
            '_' +
            serialNumber
        );
    }
}

export function getCameraOptions(camera: TServerData['camera' | 'conn_hub']): HttpOptions {
    return {
        tls: camera.protocol !== 'http',
        tlsInsecure: camera.protocol === 'https_insecure',
        ip: camera.ip,
        port: camera.port,
        user: camera.user,
        pass: camera.pass,
        keepAlive: true,
    };
}
