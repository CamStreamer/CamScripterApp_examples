import { Client, AccessOptions } from 'basic-ftp';
import { TServerData } from '../schema';
import { createFileName } from '../utils';
import { TImageData } from '../vapix/CameraImage';
import { Readable } from 'stream';

const MAX_QUEUE_LENGTH = 50;

export type TUploadJob = {
    name: string;
    openStream: () => Promise<Readable>;
};

type TQueuedJob = {
    job: TUploadJob;
    resolve: (uploaded: boolean) => void;
};

export class FTPServer {
    private client: Client;
    private accessOptions: AccessOptions;
    private uploadPath: string;
    private queue: TQueuedJob[];
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
        this.queue = [];
        this.uploading = false;
    }

    async queueVideoUpload(openStream: () => Promise<Readable>, name: string, code: string) {
        console.log(`Uploading recording, code: "${code}", to FTP server...`);
        const uploaded = await this.queueUpload({ name, openStream });
        if (uploaded) {
            console.log(`Recording ${name} uploaded successfully to FTP server.`);
        }
        return uploaded;
    }

    async queueImageUpload(code: string, images: TImageData[], serialNumber: string) {
        const baseFileName = createFileName(code, new Date(), serialNumber);
        console.log(`Uploading image(s), code: "${code}", to FTP server...`);
        const results = await Promise.all(
            images.map((image) =>
                this.queueUpload({
                    name: `${baseFileName}_camera${image.camera + 1}.jpg`,
                    openStream: () => Promise.resolve(Readable.from(image.file)),
                })
            )
        );
        const uploaded = !results.includes(false);
        if (uploaded) {
            console.log(`Image(s) ${baseFileName}.jpg uploaded successfully to FTP server.`);
        }
        return uploaded;
    }

    queueUpload(job: TUploadJob) {
        if (this.queue.length >= MAX_QUEUE_LENGTH) {
            console.error(`Upload queue is full, dropping ${job.name}`);
            return Promise.resolve(false);
        }
        return new Promise<boolean>((resolve) => {
            this.queue.push({ job, resolve });
            void this.processQueue();
        });
    }

    private async processQueue() {
        if (this.uploading) {
            // The FTP protocol doesn't allow multiple requests running in parallel
            // - https://www.npmjs.com/package/basic-ftp
            return;
        }

        this.uploading = true;
        try {
            let queued = this.queue.shift();
            while (queued !== undefined) {
                queued.resolve(await this.runJob(queued.job));
                queued = this.queue.shift();
            }
        } finally {
            this.uploading = false;
        }
    }

    private async runJob(job: TUploadJob) {
        let stream: Readable;
        try {
            if (this.client.closed) {
                await this.client.access(this.accessOptions);
            }
            stream = await job.openStream();
        } catch (err) {
            console.error(`Preparing upload of ${job.name} failed:`, err instanceof Error ? err.message : 'unknown');
            return false;
        }

        return this.uploadStream(stream, job.name);
    }

    private async uploadStream(source: Readable, name: string) {
        // Basic-ftp drops its own error listener once a transfer settles, so the destroy() below
        // would otherwise surface as an uncaught exception.
        source.on('error', () => undefined);

        try {
            await this.client.uploadFrom(source, this.uploadPath + '/' + name);
            return true;
        } catch (err) {
            console.error(`Upload of ${name} to FTP server failed:`, err instanceof Error ? err.message : 'unknown');
            // Basic-ftp documents reconnecting as the only way to continue after a failed transfer
            this.client.close();
            return false;
        } finally {
            // FromWeb() locked the stream, so cancelling it directly would throw. Destroying the
            // Readable cancels the underlying reader and releases the camera's socket.
            source.destroy();
        }
    }
}
