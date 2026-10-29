import { mock } from 'node:test';
import { Readable } from 'stream';
import { Client } from 'basic-ftp';
import { createDeferred } from './deferred';

export type TFtpUpload = {
    path: string;
    finishedAt?: number;
    bytes: Buffer;
};

const readOneChunkThenFail = async (source: Readable) => {
    await new Promise<void>((resolve, reject) => {
        source.once('data', () => {
            source.pause();
            resolve();
        });
        source.once('error', reject);
    });
    throw new Error('Simulated FTP transfer failure');
};

// Deliberately not using `for await`, which would destroy the source on its own and hide leaks.
const consume = (source: Readable, upload: TFtpUpload) =>
    new Promise<void>((resolve, reject) => {
        const chunks: Buffer[] = [];
        source.on('data', (chunk: Buffer) => chunks.push(chunk));
        source.once('end', () => {
            upload.bytes = Buffer.concat(chunks);
            upload.finishedAt = Date.now();
            resolve();
        });
        source.once('error', reject);
    });

export class FakeFtp {
    readonly uploads: TFtpUpload[] = [];
    failNextUploads = 0;
    private connected = false;
    private gate?: Promise<void>;
    private releaseGate?: () => void;

    install() {
        mock.method(Client.prototype, 'access', async () => {
            this.connected = true;
            return { code: 220, message: 'fake' };
        });
        mock.method(Client.prototype, 'close', () => {
            this.connected = false;
        });
        mock.method(Client.prototype, 'uploadFrom', async (source: Readable, path: string) =>
            this.upload(source, path)
        );
        mock.getter(Client.prototype, 'closed', () => !this.connected);
    }

    holdUploads() {
        const deferred = createDeferred();
        this.gate = deferred.promise;
        this.releaseGate = deferred.resolve;
    }

    release() {
        this.releaseGate?.();
        this.gate = undefined;
    }

    finishedUploads() {
        return this.uploads.filter((u) => u.finishedAt !== undefined);
    }

    private async upload(source: Readable, path: string) {
        const upload: TFtpUpload = { path, bytes: Buffer.alloc(0) };
        this.uploads.push(upload);

        if (this.gate !== undefined) {
            await this.gate;
        }

        if (this.failNextUploads > 0) {
            this.failNextUploads -= 1;
            await readOneChunkThenFail(source);
        }

        await consume(source, upload);
        return { code: 226, message: 'fake' };
    }
}
