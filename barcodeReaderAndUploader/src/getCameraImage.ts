import { getCameraHttpSettings, settings } from './settings';
import { CameraVapix } from 'camstreamerlib/CameraVapix';
import { Writable } from 'stream';

export const getCameraImage = () => {
    return new Promise<Buffer>((resolve) => {
        const imageStream = new Writable();
        const vapixAgent = new CameraVapix(getCameraHttpSettings());

        const bufs: Buffer[] = [];
        imageStream._write = (chunk, encoding, next) => {
            bufs.push(chunk);
            next();
        };

        imageStream._final = () => {
            resolve(Buffer.concat(bufs));
        };

        const resolution = `${settings.overlay.width}x${settings.overlay.height}`;
        vapixAgent.getCameraImage('1', '1', resolution, imageStream);
    });
};
