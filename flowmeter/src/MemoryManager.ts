import { CamOverlayDrawingAPI, UploadImageResponse } from 'camstreamerlib/CamOverlayDrawingAPI';
import * as fs from 'fs';

export class MemoryManager {
    private imgFiles: Record<string, string> = {};
    private fontFiles: Record<string, string> = {};
    private images: Record<string, UploadImageResponse> = {};
    private fonts: Record<string, string> = {};

    constructor(private co: CamOverlayDrawingAPI) {}

    async image(moniker: string) {
        if (moniker in this.images) {
            return this.images[moniker];
        } else if (moniker in this.imgFiles) {
            const imgData = fs.readFileSync(this.imgFiles[moniker]);
            this.images[moniker] = await this.co.uploadImageData(imgData);
            return this.images[moniker];
        } else {
            throw new Error('Error! Unknown image requested!');
        }
    }

    async font(moniker: string) {
        if (moniker in this.fonts) {
            return this.fonts[moniker];
        } else if (moniker in this.fontFiles) {
            this.fonts[moniker] = await this.loadTTF(this.co, this.fontFiles[moniker]);
            return this.fonts[moniker];
        } else {
            throw new Error('Error! Unknown font requested!');
        }
    }

    registerImage(moniker: string, fileName: string) {
        this.imgFiles[moniker] = process.env.INSTALL_PATH + '/images/' + fileName;
    }

    registerFont(moniker: string, fileName: string) {
        this.fontFiles[moniker] = process.env.INSTALL_PATH + '/fonts/' + fileName;
    }

    private loadTTF(co: CamOverlayDrawingAPI, fileName: string) {
        return new Promise<string>((resolve, reject) => {
            const imgData = fs.readFileSync(fileName);
            co.uploadFontData(imgData).then((fontRes) => {
                resolve(fontRes.var);
            }, reject);
        });
    }
}
