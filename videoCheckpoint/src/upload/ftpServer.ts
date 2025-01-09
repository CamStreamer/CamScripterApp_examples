import { Client, AccessOptions } from 'basic-ftp';
import { TServerData } from '../schema';
import { createFileName } from '../utils';
import { TImageData } from '../vapix/CameraImage';
import { ReadableStream } from 'stream/web';
import { Readable } from 'stream';

type Pair<T1, T2> = [T1, T2];

export class FTPServer {
    private client: Client;
    private accessOptions: AccessOptions;
    private uploadPath: string;
    private recordingsBuffer: Pair<ReadableStream, string>[];
    private imageUploadQueue: Pair<string, TImageData>[];
    private uploading: boolean;

    constructor(ftpSettings: TServerData['ftp_server']) {
        this.client = new Client(1000 * 60 * 5);
        this.accessOptions = {
            host: ftpSettings.ip,
            port: ftpSettings.port,
            user: ftpSettings.user,
            password: ftpSettings.pass,
            secure: false,
        };
        this.uploadPath = ftpSettings.upload_path;
        if (this.uploadPath[0] !== '/') {
            this.uploadPath = '/' + this.uploadPath;
        }
        this.recordingsBuffer = [];
        this.imageUploadQueue = [];
        this.uploading = false;
    }

    async queueVideoUpload(recording: ReadableStream, name: string, code: string) {
        this.recordingsBuffer.push([recording, name]);
        return await this.uploadRecordings(code, name);
    }

    async uploadRecordings(code: string, recordingName: string) {
        if (this.uploading) {
            // The FTP protocol doesn't allow multiple requests running in parallel
            // - https://www.npmjs.com/package/basic-ftp
            return false;
        }

        let result = true;
        this.uploading = true;
        console.log(`Uploading recording, code: "${code}", to FTP server...`);

        for (let i = 0; i < this.recordingsBuffer.length; i++) {
            try {
                const [recording, name] = this.recordingsBuffer[i];
                if (this.client.closed) {
                    await this.client.access(this.accessOptions);
                }
                await this.client.uploadFrom(Readable.fromWeb(recording), this.uploadPath + '/' + name);
                console.log(`Recording ${recordingName} uploaded successfully to FTP server.`);
            } catch (err) {
                result = false;
                console.error(
                    `Error uploading recording ${recordingName} to FTP server:`,
                    err instanceof Error ? err.message : 'unknown'
                );
            }
        }

        this.uploading = false;
        this.recordingsBuffer = [];
        return result;
    }

    async queueImageUpload(code: string, images: TImageData[], serialNumber: string) {
        const baseFileName = createFileName(code, new Date(), serialNumber);
        for (let i = 0; i < images.length; i++) {
            const fileName = `${baseFileName}_camera${images[i].camera + 1}.jpg`;
            this.imageUploadQueue.push([fileName, images[i]]);
        }
        return await this.uploadImages(code, baseFileName);
    }

    async uploadImages(code: string, baseImageName: string) {
        if (this.uploading) {
            return false;
        }

        let result = true;
        this.uploading = true;
        console.log(`Uploading image(s), code: "${code}", to FTP server...`);

        for (let i = 0; i < this.imageUploadQueue.length; i++) {
            try {
                const [imageName, imageBuffer] = this.imageUploadQueue[i];
                if (this.client.closed) {
                    await this.client.access(this.accessOptions);
                }
                await this.client.uploadFrom(Readable.from(imageBuffer.file), `${this.uploadPath}/${imageName}`);
                console.log(`Image(s) ${baseImageName}.jpg uploaded successfully to FTP server.`);
            } catch (err) {
                result = false;
                console.error(`Error uploading image(s) ${baseImageName}.jpg to FTP server:`, err);
            }
        }

        this.imageUploadQueue = [];
        this.uploading = false;
        return result;
    }
}
