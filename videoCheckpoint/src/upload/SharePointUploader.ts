import { TServerData } from '../schema';
import { getDate, stripCode } from '../utils';
import { TImageData } from '../vapix/CameraImage';
import { SharePoint } from './SharePoint/SharePoint';

export type TUploadedFileData = { file: Buffer; camera: string };

export class SharePointUploader {
    private storage: SharePoint;

    constructor(private sharePointSettings: TServerData['share_point']) {
        this.storage = new SharePoint(sharePointSettings);
    }

    async uploadImages(code: string, images: TImageData[]) {
        const dateInfo = getDate();

        await this.storage.authenticate();
        await this.storage.createFolder(dateInfo.date);

        // Remove forbidden characters
        const stripedCode = stripCode(code);

        return Promise.all(
            images.map((imageData) =>
                this.uploadFile(
                    imageData.file,
                    `${dateInfo.dateTime}_${stripedCode}_${imageData.camera}.jpg`,
                    `/${dateInfo.date}`
                )
            )
        );
    }

    private uploadFile = async (file: Buffer, fileName: string, dir: string) => {
        for (let tryNumber = 0; tryNumber < this.sharePointSettings.number_of_retries; tryNumber++) {
            try {
                await new Promise<void>((resolve, reject) => {
                    this.storage.uploadFile(file, fileName, dir).then(resolve).catch(reject);
                    setTimeout(reject, this.sharePointSettings.upload_timeout_s * 1000);
                });
                return;
            } catch (err) {
                console.warn(err);

                if (tryNumber === this.sharePointSettings.number_of_retries - 1) {
                    throw new Error(`Failed to upload ${fileName}`);
                }
            }
        }
    };
}
