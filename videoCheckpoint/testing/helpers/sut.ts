import * as fs from 'fs';
import * as path from 'path';
import { serverDataSchema, TServerData } from '../../src/schema';
import { FTPServer } from '../../src/upload/ftpServer';
import { GoogleDriveAPI } from '../../src/upload/GoogleDriveAPI';
import { CameraVideo } from '../../src/vapix/CameraVideo';
import { VideoScheduler } from '../../src/videoScheduler';

export const CLOSING_BARCODE = 'STOP';
export const STARTING_BARCODE = 'START';
export const SERIAL_NUMBER = 'ACCC8E000000';

export type TSutOptions = {
    cameraPort: number;
    sources?: number[];
    ftpType?: 'video' | 'image';
    googleDriveType?: 'video' | 'image';
    ftpPort?: number;
    timeoutSec?: number;
    closingBarcodeEnabled?: boolean;
    startingBarcodeEnabled?: boolean;
};

const buildSettings = ({
    cameraPort,
    sources = [0],
    ftpType = 'video',
    googleDriveType = 'image',
    ftpPort,
    timeoutSec,
    closingBarcodeEnabled = true,
    startingBarcodeEnabled = false,
}: TSutOptions): TServerData => {
    const base = serverDataSchema.parse(
        JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../localdata/settings.json'), 'utf8'))
    );
    return {
        ...base,
        camera: {
            protocol: 'http',
            ip: '127.0.0.1',
            port: cameraPort,
            user: 'root',
            pass: 'pass',
            serial_number: SERIAL_NUMBER,
        },
        video_upload: {
            ...base.video_upload,
            prebuffer_sec: 0,
            postbuffer_sec: 0,
            timeout_enabled: timeoutSec !== undefined,
            timeout_sec: timeoutSec ?? base.video_upload.timeout_sec,
            closing_barcode_enabled: closingBarcodeEnabled,
            closing_barcode: CLOSING_BARCODE,
            starting_barcode_enabled: startingBarcodeEnabled,
            starting_barcode: STARTING_BARCODE,
            camera_list: [sources[0], ...sources.slice(1)],
        },
        ftp_server: {
            ...base.ftp_server,
            type: ftpType,
            ip: '127.0.0.1',
            port: ftpPort ?? base.ftp_server.port,
            enabled: true,
            upload_path: 'videos',
        },
        google_drive: {
            ...base.google_drive,
            type: googleDriveType,
            enabled: true,
            email: 'uploader@example.com',
            private_key: 'key',
            folder_id: 'root-folder',
        },
    };
};

export const createScheduler = (options: TSutOptions) => {
    const settings = buildSettings(options);
    const ftpServer = new FTPServer(settings.ftp_server);
    const scheduler = new VideoScheduler(
        ftpServer,
        options.googleDriveType === 'video' ? new GoogleDriveAPI(settings.google_drive) : undefined,
        new CameraVideo(settings.camera),
        settings,
        settings.camera.serial_number,
        settings.video_upload
    );
    return {
        ftpServer,
        scan: async (code: string) => scheduler.onBarCodeScan(code),
        shouldShowBarcode: (code: string) => scheduler.shouldShowBarcode(code),
        isRecording: () => scheduler.getRecordingStatus,
    };
};

export type TScheduler = ReturnType<typeof createScheduler>;

export const recordVideo = async (scheduler: TScheduler, code: string) => {
    void scheduler.scan(code);
    return scheduler.scan(CLOSING_BARCODE);
};
