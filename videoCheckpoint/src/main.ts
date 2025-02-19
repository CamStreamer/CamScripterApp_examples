import * as fs from 'fs';
import { TServerData, serverDataSchema } from './schema';
import { QRCodeReader, TReading } from './input/QrCodeReader';
import { Widget } from './graphics/Widget';
import { AxisCameraStation } from './upload/AxisCameraStation';
import { Genetec } from './upload/Genetec';
import { LedIndicator } from './vapix/LedIndicator';
import { GoogleDriveAPI } from './upload/GoogleDriveAPI';
import { CameraImage } from './vapix/CameraImage';
import { CameraVideo } from './vapix/CameraVideo';
import { VideoScheduler } from './videoScheduler';
import { FTPServer } from './upload/ftpServer';
import { SharePointUploader } from './upload/SharePointUploader';
import { AxisEvents } from './upload/AxisEvents';
import { HttpServer } from 'camstreamerlib/HttpServer';

const READ_BARCODE_HIGHLIGHT_DURATION_MS = 250;
const UPLOADS_HIGHLIGHT_DURATION_MS = 250;
const FAIL_INDICATION_DURATION_MS = 250;

let settings: TServerData;
let axisEventsConnHub: AxisEvents | undefined;
let axisEventsCamera: AxisEvents | undefined;
let ledIndicator: LedIndicator | undefined;
let widget: Widget | undefined;
let acs: AxisCameraStation | undefined;
let genetec: Genetec | undefined;
let httpServer: HttpServer | undefined;
let cameraImage: CameraImage | undefined;
let cameraVideo: CameraVideo | undefined;
let googleDriveApi: GoogleDriveAPI | undefined;
let ftpServer: FTPServer | undefined;
let videoScheduler: VideoScheduler | undefined;
let shouldShowWidget = false;
let sharePointUploader: SharePointUploader | undefined;

function readSettings() {
    try {
        const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        return serverDataSchema.parse(JSON.parse(data.toString()));
    } catch (err) {
        console.log('Read settings error:', err instanceof Error ? err.message : 'unknown');
        process.exit(1);
    }
}

async function showWidget(code: string, visibilityTimeSec: number, shouldShowWidget: boolean) {
    try {
        if (widget && shouldShowWidget) {
            console.log(`Display widget, code: "${code}"`);
            await widget.showBarCode(code, visibilityTimeSec);
            return true;
        }
        return false;
    } catch (err) {
        console.error('Show widget:', err instanceof Error ? err.message : 'unknown');
        return false;
    }
}

async function sendAxisEventConnHub(code: string) {
    try {
        if (axisEventsConnHub) {
            console.log(`Send Axis event (connection hub), code: "${code}"`);
            await axisEventsConnHub.sendEvent(code);
        }
        return true;
    } catch (err) {
        console.error('Axis event (connection hub):', err instanceof Error ? err.message : 'unknown');
        return false;
    }
}

async function sendAxisEventCamera(code: string) {
    try {
        if (axisEventsCamera) {
            console.log(`Send Axis event (camera), code: "${code}"`);
            await axisEventsCamera.sendEvent(code);
        }
        return true;
    } catch (err) {
        console.error('Axis event (camera):', err instanceof Error ? err.message : 'unknown');
        return false;
    }
}

async function sendAcsEvent(code: string) {
    try {
        if (acs) {
            console.log(`Send ACS event, code: "${code}"`);
            await acs.sendEvent(code);
        }
        return true;
    } catch (err) {
        console.error('ACS event:', err instanceof Error ? err.message : 'unknown');
        return false;
    }
}

async function sendGenetecBookmark(code: string) {
    try {
        if (genetec) {
            console.log(`Send Genetec bookmark, code: "${code}"`);
            await genetec.sendBookmark(code);
        }
        return true;
    } catch (err) {
        console.error('Genetec bookmark:', err instanceof Error ? err.message : 'unknown');
        return false;
    }
}

async function uploadImages(code: string) {
    try {
        if (googleDriveApi === undefined && sharePointUploader === undefined && ftpServer === undefined) {
            return true;
        }

        const imageData = await cameraImage?.getImageDataFromCamera();
        if (!imageData) {
            return false;
        }

        const promiseArr = await Promise.all([
            settings.google_drive.type === 'image'
                ? googleDriveApi?.uploadImages(code, imageData, settings.camera.serial_number)
                : true,
            sharePointUploader?.uploadImages(code, imageData),
            settings.ftp_server.type === 'image'
                ? ftpServer?.queueImageUpload(code, imageData, settings.camera.serial_number)
                : true,
        ]);

        if (promiseArr.includes(false)) {
            return false;
        } else {
            return true;
        }
    } catch (err) {
        console.error('Upload images:', err instanceof Error ? err.message : 'unknown');
        return false;
    }
}

async function uploadVideo(code: string) {
    try {
        if (videoScheduler !== undefined) {
            return await videoScheduler.onBarCodeScan(code);
        }
        return false;
    } catch (err) {
        console.error('Upload video:', err instanceof Error ? err.message : 'unknown');
        return false;
    }
}

function main() {
    try {
        settings = readSettings();

        if (settings.led.enabled) {
            if (
                settings.conn_hub.ip.length !== 0 &&
                settings.conn_hub.user.length !== 0 &&
                settings.conn_hub.pass.length !== 0 &&
                settings.led.led_green_port !== undefined &&
                settings.led.led_red_port !== undefined
            ) {
                ledIndicator = new LedIndicator(settings.conn_hub, settings.led);
            } else {
                console.log('Led indication is not configured and thus is disabled.');
            }
        }

        if (
            settings.output_camera.ip.length !== 0 &&
            settings.output_camera.user.length !== 0 &&
            settings.output_camera.pass.length !== 0
        ) {
            widget = new Widget(settings.output_camera, settings.widget);
        } else {
            console.log('The CamOverlay widget is not configured and thus is disabled.');
        }

        if (settings.axis_events?.conn_hub) {
            if (
                settings.conn_hub.ip.length !== 0 &&
                settings.conn_hub.user.length !== 0 &&
                settings.conn_hub.pass.length !== 0
            ) {
                axisEventsConnHub = new AxisEvents(settings.conn_hub);
            } else {
                console.log('Axis events integration for connectivity hub is not configured and thus is disabled.');
            }
        }

        if (settings.axis_events?.camera) {
            if (
                settings.camera.ip.length !== 0 &&
                settings.camera.user.length !== 0 &&
                settings.camera.pass.length !== 0
            ) {
                axisEventsCamera = new AxisEvents(settings.camera);
            } else {
                console.log('Axis events integration for camera is not configured and thus is disabled.');
            }
        }

        if (settings.acs.enabled) {
            if (
                settings.acs.ip.length !== 0 &&
                settings.acs.user.length !== 0 &&
                settings.acs.pass.length !== 0 &&
                settings.acs.source_key.length !== 0
            ) {
                acs = new AxisCameraStation(settings.acs);
            } else {
                console.log('Axis Camera Station is not configured and thus is disabled.');
            }
        }

        if (settings.genetec.enabled) {
            if (
                settings.genetec.ip.length !== 0 &&
                settings.genetec.user.length !== 0 &&
                settings.genetec.pass.length !== 0 &&
                settings.genetec.app_id.length !== 0 &&
                settings.genetec.base_uri.length !== 0
            ) {
                genetec = new Genetec(settings.genetec);
                httpServer = new HttpServer();
            } else {
                console.log('Genetec integration is not configured and thus is disabled.');
            }
        }

        if (settings.google_drive.enabled) {
            if (
                settings.camera.ip.length !== 0 &&
                settings.camera.user.length !== 0 &&
                settings.camera.pass.length !== 0
            ) {
                googleDriveApi = new GoogleDriveAPI(settings.google_drive);
            } else {
                console.log('The Google Drive upload is not configured and thus is disabled.');
            }
        }

        if (settings.ftp_server.enabled) {
            if (
                settings.ftp_server.ip.length !== 0 &&
                settings.ftp_server.user.length !== 0 &&
                settings.ftp_server.pass.length !== 0
            ) {
                ftpServer = new FTPServer(settings.ftp_server);
            } else {
                console.log('FTP Server is not configured and thus is disabled.');
            }
        }

        if (settings.share_point.enabled) {
            if (
                settings.share_point.url.length !== 0 &&
                settings.share_point.output_dir.length !== 0 &&
                settings.share_point.client_secret.length !== 0 &&
                settings.share_point.client_id.length !== 0 &&
                settings.share_point.tenant_id.length !== 0
            ) {
                sharePointUploader = new SharePointUploader(settings.share_point);
            } else {
                console.log('The SharePoint upload is not configured and thus is disabled.');
            }
        }

        if (cameraImage === undefined) {
            cameraImage = new CameraImage(settings.camera, settings.image_upload);
        }
        if (cameraVideo === undefined) {
            cameraVideo = new CameraVideo(settings.camera);
        }

        if (videoScheduler === undefined) {
            videoScheduler = new VideoScheduler(
                ftpServer,
                googleDriveApi,
                cameraVideo,
                settings,
                settings.camera.serial_number,
                settings.video_upload
            );
        }

        const qrCodeReader = new QRCodeReader(settings.barcode_validation_rule);
        qrCodeReader.on('valid_reading', async (data: TReading) => {
            console.log(`Reader - valid code received: "${data.code}"`);
            await ledIndicator?.indicateSuccess(READ_BARCODE_HIGHLIGHT_DURATION_MS, 1);

            if (videoScheduler !== undefined) {
                shouldShowWidget = videoScheduler.shouldShowBarcode(data.code);
            }

            const showWidgetStatus = await showWidget(data.code, settings.widget.visibility_time_sec, shouldShowWidget);

            await sendAxisEventConnHub(data.code);
            await sendAxisEventCamera(data.code);
            await sendAcsEvent(data.code);
            await sendGenetecBookmark(data.code);

            const promiseArr: Promise<boolean>[] = [];
            let imagesUploadStatus;
            let videoUploadStatus;

            // Image upload
            if (
                (showWidgetStatus && googleDriveApi !== undefined && settings.google_drive.type === 'image') ||
                (showWidgetStatus && ftpServer !== undefined && settings.ftp_server.type === 'image')
            ) {
                promiseArr.push(
                    uploadImages(data.code).then((result) => {
                        imagesUploadStatus = result;
                        return result;
                    })
                );
            }

            // Video upload
            if (
                (showWidgetStatus && googleDriveApi !== undefined && settings.google_drive.type === 'video') ||
                (showWidgetStatus && ftpServer !== undefined && settings.ftp_server.type === 'video')
            ) {
                promiseArr.push(
                    uploadVideo(data.code).then((result) => {
                        videoUploadStatus = result;
                        return result;
                    })
                );
            }

            const results = await Promise.allSettled(promiseArr);

            if (results.length === 1) {
                // Handle video upload indication
                if (videoUploadStatus !== undefined) {
                    if (videoUploadStatus && !videoScheduler?.getRecordingStatus) {
                        void ledIndicator?.indicateSuccess(UPLOADS_HIGHLIGHT_DURATION_MS, 2);
                    } else if (!videoUploadStatus && !videoScheduler?.getRecordingStatus) {
                        void ledIndicator?.indicateFailure(FAIL_INDICATION_DURATION_MS, 2);
                    }
                }

                // Handle image upload status
                if (imagesUploadStatus !== undefined) {
                    if (imagesUploadStatus) {
                        void ledIndicator?.indicateSuccess(UPLOADS_HIGHLIGHT_DURATION_MS, 2);
                    } else {
                        void ledIndicator?.indicateFailure(FAIL_INDICATION_DURATION_MS, 2);
                    }
                }
            }

            if (results.length === 2) {
                // Handle both upload indication
                if (imagesUploadStatus !== undefined) {
                    if (imagesUploadStatus) {
                        void ledIndicator?.indicateSuccess(UPLOADS_HIGHLIGHT_DURATION_MS, 2);
                    } else {
                        void ledIndicator?.indicateFailure(FAIL_INDICATION_DURATION_MS, 2);
                    }
                }

                if (videoUploadStatus !== undefined) {
                    if (videoUploadStatus && !videoScheduler?.getRecordingStatus) {
                        void ledIndicator?.indicateSuccess(UPLOADS_HIGHLIGHT_DURATION_MS, 2);
                    } else if (!videoUploadStatus && !videoScheduler?.getRecordingStatus) {
                        void ledIndicator?.indicateFailure(FAIL_INDICATION_DURATION_MS, 2);
                    }
                }
            }
        });

        qrCodeReader.on('invalid_reading', async (data: TReading) => {
            console.log(`Reader - invalid code received: "${data.code}"`);
            await ledIndicator?.indicateFailure(READ_BARCODE_HIGHLIGHT_DURATION_MS, 1);
        });

        void ledIndicator?.indicateOnScriptStart();
        console.log('Application started');
    } catch (err) {
        console.error('Application start:', err);
        httpServer?.close();
        process.exit(1);
    }
}

process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled rejection:', err);
});

main();
