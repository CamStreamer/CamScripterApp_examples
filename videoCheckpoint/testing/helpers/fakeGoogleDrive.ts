import { mock } from 'node:test';
import { Readable } from 'stream';
import * as googleDrive from '@googleapis/drive';
import { JWT } from 'google-auth-library';

export type TDriveUpload = {
    name: string;
    firstChunkAt?: number;
    bytes: Buffer;
};

type TCreateParams = {
    media?: { body: Readable };
    requestBody: { name: string };
};

const readAll = async (body: Readable, upload: TDriveUpload) => {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
        upload.firstChunkAt ??= Date.now();
        chunks.push(Buffer.from(chunk));
    }
    upload.bytes = Buffer.concat(chunks);
};

const readOneChunk = (body: Readable) =>
    new Promise<void>((resolve, reject) => {
        body.once('data', () => {
            body.pause();
            resolve();
        });
        body.once('error', reject);
    });

export class FakeGoogleDrive {
    readonly uploads: TDriveUpload[] = [];
    failNextUploads = 0;

    install() {
        mock.method(JWT.prototype, 'authorize', async () => ({}));
        const files = {
            list: async () => ({ data: { files: [{ id: 'day-folder', name: 'day' }] } }),
            create: async ({ media, requestBody }: TCreateParams) => {
                if (media === undefined) {
                    return { data: { id: 'folder' } };
                }
                const upload: TDriveUpload = { name: requestBody.name, bytes: Buffer.alloc(0) };
                this.uploads.push(upload);
                if (this.failNextUploads > 0) {
                    this.failNextUploads -= 1;
                    await readOneChunk(media.body);
                    throw new Error('Simulated Google Drive upload failure');
                }
                await readAll(media.body, upload);
                return { data: { id: `file-${this.uploads.length}` } };
            },
        };
        mock.method(googleDrive, 'drive', () => ({ files }));
    }
}
