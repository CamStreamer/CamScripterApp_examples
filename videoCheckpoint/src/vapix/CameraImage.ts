import { TServerData } from '../schema';
import { VapixAPI } from 'camstreamerlib/cjs';
import { DefaultClient } from 'camstreamerlib/cjs/node';
import { getCameraOptions } from '../utils';

const TIMEOUT_MS = 10_000;

export type TImageData = {
    file: Buffer;
    camera: number;
};

export class CameraImage {
    private vapix: VapixAPI;

    constructor(cameraSettings: TServerData['camera'], private imageUpload: TServerData['image_upload']) {
        const options = getCameraOptions(cameraSettings);
        const httpClient = new DefaultClient(options);
        this.vapix = new VapixAPI(httpClient);
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
        return new Promise<Buffer>(async (resolve, reject) => {
            const resolution = this.imageUpload.resolution;

            try {
                const res = await this.vapix.getCameraImage({
                    resolution: resolution,
                    compression: 10,
                    camera: camera,
                });

                if (res.ok === false) {
                    throw new Error(`GetCameraImage: ${res.status} ${res.statusText}`);
                }

                const imageData = await res.arrayBuffer();
                resolve(Buffer.from(imageData));
            } catch (err) {
                const error = err instanceof Error ? err.message : JSON.stringify(err);
                reject(new Error(`GetCameraImage: ${error}`));
            }
        });
    }
}
