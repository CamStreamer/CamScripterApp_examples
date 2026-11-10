import { PassThrough, Readable } from 'stream';
import { TServerData } from './schema';
import { FTPServer } from './upload/ftpServer';
import { GoogleDriveAPI } from './upload/GoogleDriveAPI';
import { CameraVideo, TExportRequest } from './vapix/CameraVideo';
import { createFileName } from './utils';

export class VideoScheduler {
    private timeoutID?: NodeJS.Timeout;
    private recordingStart?: number;
    private lastCode?: string;
    private recordingIsOngoing: boolean;
    private sourceList: number[];

    constructor(
        private server: FTPServer | undefined,
        private googleDrive: GoogleDriveAPI | undefined,
        private camera: CameraVideo | undefined,
        private generalSettings: TServerData,
        private serialNumber: TServerData['camera']['serial_number'],
        private settings: TServerData['video_upload']
    ) {
        this.recordingIsOngoing = false;
        this.sourceList = this.settings.camera_list;
    }

    get getRecordingStatus() {
        return this.recordingIsOngoing;
    }

    async onBarCodeScan(code: string) {
        try {
            if (this.accidentalRead(code)) {
                return this.scanResultWithoutUpload();
            }
            const startRecording = this.willStartRecording(code); // Must be evaluated before clearing metadata
            let video: Promise<boolean> | undefined;

            if (this.willStopRecording(code)) {
                // Ending recording
                video = this.delayedMakeVideo(this.recordingStart, this.lastCode as string);
                this.clearMetadata();
            }
            if (startRecording) {
                // Starting recording
                this.setMetadata(code);
            }
            return video === undefined ? this.scanResultWithoutUpload() : await video;
        } catch (err) {
            console.error('Error while processing recording:', err);
            return false;
        }
    }

    shouldShowBarcode(code: string) {
        let result = true;

        result &&= !this.accidentalRead(code);

        if (this.settings.closing_barcode_enabled) {
            result &&= code !== this.settings.closing_barcode;
        }

        if (this.settings.starting_barcode_enabled) {
            return result && code !== this.settings.starting_barcode;
        } else {
            return result;
        }
    }

    private willStopRecording(code: string) {
        if (!this.recordingIsOngoing) {
            return false;
        }
        if (this.settings.closing_barcode_enabled) {
            return code === this.settings.closing_barcode;
        }
        if (this.settings.starting_barcode_enabled) {
            return code === this.settings.starting_barcode;
        }
        return true;
    }

    private willStartRecording(code: string) {
        if (!this.willStopRecording(code) && this.recordingIsOngoing) {
            return false;
        }
        if (this.settings.starting_barcode_enabled) {
            return code === this.settings.starting_barcode;
        }
        if (this.settings.closing_barcode_enabled) {
            return code !== this.settings.closing_barcode && code !== this.lastCode;
        }
        return code !== this.lastCode;
    }

    private accidentalRead(code: string) {
        return code === this.lastCode && this.recordingStart !== undefined && Date.now() - this.recordingStart < 3000;
    }

    // A scan that leaves a recording running has nothing to report until that recording is closed.
    private scanResultWithoutUpload() {
        return this.recordingIsOngoing ? undefined : true;
    }

    private setMetadata(code: string) {
        this.recordingIsOngoing = true;
        this.recordingStart = Date.now();

        const startTime = this.recordingStart; // If I pass this.startTime directly, it for some reason does not store the value immediately, which is neccessary
        this.lastCode = code;

        if (this.settings.timeout_enabled) {
            this.timeoutID = setTimeout(
                async () => await this.onTimeout(startTime, code),
                (this.settings.timeout_sec + this.settings.postbuffer_sec) * 1000
            );
        }
    }

    private async onTimeout(startTime: number, code: string) {
        this.clearMetadata();
        try {
            await this.makeVideo(startTime, code);
        } catch (err) {
            console.error('Error while processing recording after timeout:', err);
        }
    }

    private async delayedMakeVideo(startTime: number | undefined, code: string) {
        await new Promise((resolve) => {
            setTimeout(resolve, this.settings.postbuffer_sec * 1000);
        });
        return this.makeVideo(startTime, code);
    }

    private clearMetadata() {
        clearTimeout(this.timeoutID);
        this.recordingIsOngoing = false;
        this.timeoutID = undefined;
        this.recordingStart = undefined;
        this.lastCode = undefined;
    }

    private async makeVideo(startTime: number | undefined, code: string) {
        if (this.camera === undefined) {
            return false;
        }
        if (startTime === undefined) {
            console.error('Cannot download a video, starttime was not set');
            return false;
        }
        const server = this.generalSettings.ftp_server.type === 'video' ? this.server : undefined;
        const googleDrive = this.generalSettings.google_drive.type === 'video' ? this.googleDrive : undefined;
        if (server === undefined && googleDrive === undefined) {
            console.log('No upload target is set to video, nothing will be uploaded.');
            return true;
        }

        const endTime = Date.now(); // Getting now so the video is not longer because of fetching stuff
        const from = startTime - this.settings.prebuffer_sec * 1000;
        const uploads: Promise<boolean>[] = [];
        let errorCount = 0;

        const camera = this.camera;
        for (const source of this.sourceList) {
            let request: TExportRequest;
            try {
                request = await camera.prepareExport(from, endTime, source);
            } catch (err) {
                errorCount += 1;
                console.error(`Preparing video for source ${source + 1} failed:`, err);
                continue;
            }

            const openExport = async () => Readable.fromWeb(await camera.openExport(request));
            const recordingName = `${createFileName(code, new Date(), this.serialNumber, source)}.mkv`;

            if (server && googleDrive) {
                uploads.push(this.uploadToBoth(server, googleDrive, openExport, recordingName, code));
            } else if (server) {
                uploads.push(server.queueVideoUpload(openExport, recordingName, code));
            } else if (googleDrive) {
                uploads.push(googleDrive.uploadVideo(openExport, recordingName, code));
            }
        }

        const uploaded = await Promise.all(uploads);
        return errorCount === 0 && !uploaded.includes(false);
    }

    private async uploadToBoth(
        server: FTPServer,
        googleDrive: GoogleDriveAPI,
        openExport: () => Promise<Readable>,
        name: string,
        code: string
    ) {
        let exportOpened = false;
        let driveUpload: Promise<boolean> | undefined;

        // The export is opened only once the FTP queue gets to it, so it does not idle behind earlier uploads.
        const ftpUploaded = await server.queueVideoUpload(
            async () => {
                exportOpened = true;
                const [toFtp, toDrive] = this.duplicate(await openExport());
                driveUpload = this.uploadDriveCopy(googleDrive, toDrive, name, code);
                return toFtp;
            },
            name,
            code
        );

        if (driveUpload === undefined) {
            // The FTP job never reached the export (e.g. no connection), so Drive needs its own one.
            driveUpload = exportOpened ? Promise.resolve(false) : googleDrive.uploadVideo(openExport, name, code);
        }
        const driveUploaded = await driveUpload;
        return ftpUploaded && driveUploaded;
    }

    private duplicate(source: Readable) {
        const copies = [new PassThrough(), new PassThrough()];
        let openCopies = copies.length;

        source.on('error', (err) => copies.forEach((copy) => copy.destroy(err)));
        for (const copy of copies) {
            // Uploaders attach their own error listeners; this only covers the time before they do.
            copy.on('error', () => undefined);
            copy.on('close', () => {
                openCopies -= 1;
                if (openCopies === 0) {
                    source.destroy();
                }
            });
            source.pipe(copy);
        }
        return copies;
    }

    private async uploadDriveCopy(googleDrive: GoogleDriveAPI, copy: PassThrough, name: string, code: string) {
        try {
            return await googleDrive.uploadVideo(() => Promise.resolve(copy), name, code);
        } finally {
            // Drive may fail before reading, and an unread copy would stall the FTP upload.
            copy.destroy();
        }
    }
}
