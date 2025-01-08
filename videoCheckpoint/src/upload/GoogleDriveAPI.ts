import * as Stream from 'stream';
import { drive, drive_v3 } from '@googleapis/drive';
import { JWT } from 'google-auth-library';
import { TImageData } from '../vapix/CameraImage';
import { getDate, stripCode, createFileName, convertWebStreamToNodeReadable } from '../utils';
import { TServerData } from '../schema';

export class GoogleDriveAPI {
    private fileType: string;

    constructor(private googleDriveSettings: TServerData['google_drive']) {
        this.fileType = googleDriveSettings.type;
    }

    async uploadImages(code: string, images: TImageData[], serialNumber: string) {
        if (this.fileType !== 'image') {
            return;
        }

        // Remove forbidden characters
        const stripedCode = stripCode(code);
        const dateInfo = getDate();
        const authClient = await this.authorize();
        const googleDrive = drive({ version: 'v3', auth: authClient });
        const folderId = await this.createFolder(googleDrive, dateInfo.date);
        const baseImageName = createFileName(stripedCode, new Date(), serialNumber);

        console.log(`Uploading image(s), code: "${code}", to Google Drive...`);

        try {
            await Promise.all(
                images.map(async (imageData) => {
                    const imageName = `${baseImageName}_camera${imageData.camera + 1}.jpg`;
                    await this.uploadImageFile(googleDrive, folderId, imageData.file, imageName);
                })
            );
            console.log(`Image(s) ${baseImageName}.jpg uploaded successfully to Google Drive.`);
            return true;
        } catch (err) {
            console.error(
                `Error uploading image(s) ${baseImageName}.jpg to Google Drive:`,
                err instanceof Error ? err.message : 'unknown'
            );
            return false;
        }
    }

    async uploadVideo(recording: ReadableStream, name: string, code: string) {
        const dateInfo = getDate();

        console.log(`Uploading recording, code: "${code}", to Google Drive...`);

        try {
            const authClient = await this.authorize();
            const googleDrive = drive({ version: 'v3', auth: authClient });
            const folderId = await this.createFolder(googleDrive, dateInfo.date);

            await this.uploadVideoFile(googleDrive, folderId, recording, name);
            console.log(`Recording ${name} uploaded successfully to Google Drive.`);
            return true;
        } catch (err) {
            console.error(
                `Error uploading recording ${name} to Google Drive:`,
                err instanceof Error ? err.message : 'unknown'
            );
            return false;
        }
    }

    // Authorize with service account and get jwt client
    private async authorize() {
        const privateKey = this.googleDriveSettings.private_key.split(String.raw`\n`).join('\n');
        const scopes = ['https://www.googleapis.com/auth/drive.file'];
        const jwtClient = new JWT(this.googleDriveSettings.email, undefined, privateKey, scopes);
        await jwtClient.authorize();
        return jwtClient;
    }

    private async createFolder(drive: drive_v3.Drive, folderName: string) {
        // Check if folder already exists and create a new one if necessary
        const folderSearch = await drive.files.list({
            q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and '${this.googleDriveSettings.folder_id}' in parents`,
            fields: 'nextPageToken, files(id, name)',
            spaces: 'drive',
        });
        let folderId: string;
        if (
            folderSearch.data.files !== undefined &&
            folderSearch.data.files.length > 0 &&
            typeof folderSearch.data.files[0].id === 'string'
        ) {
            folderId = folderSearch.data.files[0].id;
        } else {
            const folder = await drive.files.create({
                fields: 'id',
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [this.googleDriveSettings.folder_id],
                },
            });
            if (typeof folder.data.id !== 'string') {
                throw new Error('GoogleDriveAPI: cannot create folder');
            }
            folderId = folder.data.id;
        }
        return folderId;
    }

    private async uploadImageFile(drive: drive_v3.Drive, folderId: string, fileData: Buffer, fileName: string) {
        // Create readable stream
        const readableStream = new Stream.Readable();
        readableStream.push(fileData);
        readableStream.push(null);

        // Upload file to the folder
        const file = await drive.files.create({
            media: {
                body: readableStream,
            },
            fields: 'id',
            requestBody: {
                name: fileName,
                parents: [folderId],
            },
        });
        return file.data.id;
    }

    private async uploadVideoFile(drive: drive_v3.Drive, folderId: string, recording: ReadableStream, name: string) {
        const readableStream = await convertWebStreamToNodeReadable(recording);

        const file = await drive.files.create({
            media: {
                body: readableStream,
            },
            fields: 'id',
            requestBody: {
                name: name,
                parents: [folderId],
            },
        });
        return file.data.id;
    }
}
