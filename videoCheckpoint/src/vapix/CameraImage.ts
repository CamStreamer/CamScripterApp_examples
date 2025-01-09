import { Writable } from 'stream';
import { TServerData } from '../schema';
import { CameraVapix } from 'camstreamerlib/CameraVapix';

const TIMEOUT_MS = 10_000;

export type TImageData = {
    file: Buffer;
    camera: number;
};

export class CameraImage {
    private cameraVapix: CameraVapix;

    constructor(cameraSettings: TServerData['camera'], private imageUpload: TServerData['image_upload']) {
        const options = {
            tls: cameraSettings.protocol !== 'http',
            tlsInsecure: cameraSettings.protocol === 'https_insecure',
            ip: cameraSettings.ip,
            port: cameraSettings.port,
            user: cameraSettings.user,
            pass: cameraSettings.pass,
        };
        this.cameraVapix = new CameraVapix(options);
    }

    async getImageDataFromCamera(): Promise<TImageData[]> {
        const images: TImageData[] = [];
        for (const cameraListIndex in this.imageUpload.camera_list) {
            const vapixCamera = this.imageUpload.camera_list[cameraListIndex] + 1;
            const image = await this.getCameraImage(vapixCamera.toString());
            images.push({
                file: image,
                camera: this.imageUpload.camera_list[cameraListIndex],
            });
        }
        return images;
    }

    private getCameraImage(camera: string) {
        return new Promise<Buffer>((resolve, reject) => {
            const imageStream = new Writable();

            const timeout = setTimeout(() => {
                imageStream.destroy();
                reject(new Error('CameraImage - get image timed out for view area ' + camera));
            }, TIMEOUT_MS);

            const bufs: Buffer[] = [];
            imageStream._write = (chunk, encoding, next) => {
                if (imageStream.destroyed) {
                    return;
                }
                bufs.push(chunk);
                next();
            };

            imageStream._final = () => {
                clearTimeout(timeout);
                resolve(Buffer.concat(bufs));
            };

            const resolution = this.imageUpload.resolution;
            this.cameraVapix.getCameraImage(camera, '10', resolution, Writable.toWeb(imageStream)).catch((err) => {
                reject(new Error(`GetCameraImage: ${err.message}`));
            });
        });
    }
}
