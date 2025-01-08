import { TServerData } from './schema';
import { FTPServer } from './upload/ftpServer';
import { GoogleDriveAPI } from './upload/GoogleDriveAPI';
import { CameraVideo } from './vapix/CameraVideo';
import { createFileName } from './utils';

export class VideoScheduler {
    private timeoutID?: NodeJS.Timeout;
    private recordingStart?: number;
    private lastCode?: string;
    private recordingIsOngoing: boolean;
    private sourceList: number[];
    private recordingStatus: boolean | undefined;

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
        this.recordingStatus = false;
    }

    get getRecordingStatus() {
        return this.recordingStatus;
    }

    async onBarCodeScan(code: string) {
        try {
            if (!this.accidentalRead(code)) {
                const startRecording = this.willStartRecording(code); // Must be evaluated before clearing metadata

                if (this.willStopRecording(code)) {
                    // Ending recording
                    this.recordingStatus = false;
                    const result = await this.delayedMakeVideo();
                    this.clearMetadata();
                    return result;
                }
                if (startRecording) {
                    // Starting recording
                    this.recordingStatus = true;
                    this.setMetadata(code);
                }
            }
            return true;
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
        await this.makeVideo(startTime, code);
        this.clearMetadata();
    }

    private async delayedMakeVideo() {
        const startTime = this.recordingStart; // If I pass this.startTime directly, it for some reason does not store the value immediately, which is neccessary
        const codeToPass = this.lastCode as string;

        const result = new Promise<boolean>((resolve) => {
            setTimeout(async () => {
                const res = await this.makeVideo(startTime, codeToPass);
                resolve(res);
            }, this.settings.postbuffer_sec * 1000);
        });
        return await result;
    }

    private clearMetadata() {
        clearTimeout(this.timeoutID);
        this.recordingIsOngoing = false;
        this.timeoutID = undefined;
        this.recordingStart = undefined;
        this.lastCode = undefined;
    }

    private async downloadVideos(startTime: number) {
        const endTime = Date.now(); // Getting now so the video is not longer because of fetching stuff

        const promiseArr = [];
        for (const source of this.sourceList) {
            try {
                promiseArr.push(
                    this.camera?.downloadRecording(startTime - this.settings.prebuffer_sec * 1000, endTime, source)
                );
            } catch (err) {
                console.error('Error while downloading video:', err);
            }
        }

        if (promiseArr.length === 0) {
            console.log(
                'Warning: There are no ongoing recordings from selected sources. Nothing will be downloaded nor uploaded.'
            );
        }
        return Promise.all(promiseArr);
    }

    private async makeVideo(startTime: number | undefined, code: string) {
        try {
            if (startTime === undefined) {
                throw Error('Cannot download a video, starttime was not set');
            }

            const recordings = await this.downloadVideos(startTime);
            const promiseArr: Promise<boolean>[] = [];
            let sourceIter = 0;
            for (const recording of recordings) {
                if (recording) {
                    const source = this.sourceList[sourceIter];
                    const [ftpRecording, googleDriveRecording] = recording.tee();
                    const recordingName = `${createFileName(code, new Date(), this.serialNumber, source)}.mkv`;
                    if (this.server && this.generalSettings.ftp_server.type === 'video') {
                        promiseArr.push(this.server.queueVideoUpload(ftpRecording, recordingName, code));
                    }

                    if (this.googleDrive && this.generalSettings.google_drive.type === 'video') {
                        promiseArr.push(
                            this.googleDrive.uploadVideo(googleDriveRecording as ReadableStream, recordingName, code)
                        );
                    }
                    sourceIter += 1;
                }
            }
            const res = await Promise.all(promiseArr);

            if (res.includes(false)) {
                return false;
            } else {
                return true;
            }
        } catch (err) {
            console.error('Error while working with video:', err);
            return false;
        }
    }
}
