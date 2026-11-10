import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import * as assert from 'assert';
import { FakeCamera } from './helpers/fakeCamera';
import { FakeFtp } from './helpers/fakeFtp';
import { FakeGoogleDrive } from './helpers/fakeGoogleDrive';
import { delay, waitUntil } from './helpers/deferred';
import { createScheduler, recordVideo } from './helpers/sut';

const LIST_PATH = '/axis-cgi/record/list.cgi';

describe('video upload', () => {
    let camera: FakeCamera;
    let ftp: FakeFtp;
    let drive: FakeGoogleDrive;
    let cameraPort: number;

    beforeEach(async () => {
        camera = new FakeCamera();
        cameraPort = await camera.start();
        ftp = new FakeFtp();
        ftp.install();
        drive = new FakeGoogleDrive();
        drive.install();
    });

    afterEach(async () => {
        ftp.release();
        mock.restoreAll();
        await camera.stop();
    });

    it('reports failure when an upload fails', async () => {
        ftp.failNextUploads = 1;
        const scheduler = createScheduler({ cameraPort });
        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), false);
    });

    it('sends the full recording to both FTP and Google Drive', async () => {
        const scheduler = createScheduler({ cameraPort, googleDriveType: 'video' });
        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), true);

        assert.strictEqual(camera.exports.length, 1);
        assert.strictEqual(ftp.finishedUploads().length, 1);
        assert.strictEqual(drive.uploads.length, 1);
        assert.strictEqual(drive.uploads[0].bytes.length, camera.expectedExportBytes());
        assert.ok(drive.uploads[0].bytes.equals(ftp.uploads[0].bytes));
    });

    it('keeps uploading to Google Drive when the FTP transfer fails', async () => {
        ftp.failNextUploads = 1;
        const scheduler = createScheduler({ cameraPort, googleDriveType: 'video' });
        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), false);

        assert.strictEqual(camera.exports.length, 1);
        assert.strictEqual(drive.uploads[0].bytes.length, camera.expectedExportBytes());
    });

    it('keeps uploading to FTP when the Google Drive upload fails', async () => {
        drive.failNextUploads = 1;
        const scheduler = createScheduler({ cameraPort, googleDriveType: 'video' });
        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), false);

        assert.strictEqual(camera.exports.length, 1);
        assert.strictEqual(ftp.finishedUploads()[0].bytes.length, camera.expectedExportBytes());
    });

    it('does not contact the camera when no upload target is set to video', async () => {
        const scheduler = createScheduler({ cameraPort, ftpType: 'image', googleDriveType: 'image' });
        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), true);
        assert.strictEqual(camera.countRequests(LIST_PATH), 0);
        assert.strictEqual(camera.exports.length, 0);
    });

    it('streams to Google Drive while the camera is still sending', async () => {
        camera.exportBehaviour = { chunks: 50, chunkIntervalMs: 20 };
        const scheduler = createScheduler({ cameraPort, ftpType: 'image', googleDriveType: 'video' });
        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), true);

        const firstChunkAt = drive.uploads[0].firstChunkAt ?? Infinity;
        const cameraFinishedAt = camera.exports[0].finishedAt ?? -Infinity;
        assert.ok(firstChunkAt < cameraFinishedAt, 'Google Drive received nothing until the whole export was read');
    });

    it('opens the export only when the FTP connection is free', async () => {
        ftp.holdUploads();
        const scheduler = createScheduler({ cameraPort });
        void recordVideo(scheduler, 'CODE1');
        await waitUntil(() => ftp.uploads.length === 1, 5000, 'first upload to start');

        void recordVideo(scheduler, 'CODE2');
        await waitUntil(() => camera.countRequests(LIST_PATH) === 2, 5000, 'second recording lookup');
        await delay(200);
        assert.strictEqual(camera.exports.length, 1, 'second export opened while the first upload was running');

        ftp.release();
        await waitUntil(() => ftp.finishedUploads().length === 2, 5000, 'both uploads to finish');
        const firstFinishedAt = ftp.uploads[0].finishedAt ?? Infinity;
        assert.ok(camera.exports[1].openedAt >= firstFinishedAt);
    });

    it('still uploads the recording sources when another source is not recording', async () => {
        camera.recordingSources = [2];
        const scheduler = createScheduler({ cameraPort, sources: [0, 1] });
        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), false);

        const paths = ftp.finishedUploads().map((u) => u.path);
        assert.strictEqual(paths.length, 1);
        assert.ok(paths[0].endsWith('_camera2.mkv'));
    });

    it('reports failure and opens no export when the recording list cannot be fetched', async () => {
        camera.listStatus = 500;
        const scheduler = createScheduler({ cameraPort, sources: [0, 1] });
        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), false);
        assert.strictEqual(camera.exports.length, 0);
        assert.strictEqual(ftp.uploads.length, 0);
    });

    it('reports failure when the camera rejects the export and keeps uploading afterwards', async () => {
        camera.exportBehaviour = { status: 503 };
        const scheduler = createScheduler({ cameraPort });
        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), false);
        assert.strictEqual(ftp.uploads.length, 0);

        camera.exportBehaviour = {};
        assert.strictEqual(await recordVideo(scheduler, 'CODE2'), true);
        assert.strictEqual(ftp.finishedUploads().length, 1);
    });

    it('releases the camera connection when the Google Drive upload fails', async () => {
        camera.exportBehaviour = { chunks: 500, chunkIntervalMs: 20 };
        drive.failNextUploads = 1;
        const scheduler = createScheduler({ cameraPort, ftpType: 'image', googleDriveType: 'video' });
        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), false);

        const released = await Promise.race([
            camera.exports[0].closedEarly.then(() => true),
            delay(3000).then(() => false),
        ]);
        assert.ok(released, 'camera export connection stayed open after the Google Drive upload failed');
    });

    it('starts a new recording while the previous one is still uploading', async () => {
        ftp.holdUploads();
        const scheduler = createScheduler({ cameraPort });
        const first = recordVideo(scheduler, 'CODE1');
        await waitUntil(() => ftp.uploads.length === 1, 5000, 'first upload to start');

        const second = recordVideo(scheduler, 'CODE2');
        await waitUntil(() => camera.countRequests(LIST_PATH) === 2, 5000, 'second recording lookup');
        ftp.release();

        assert.deepStrictEqual(await Promise.all([first, second]), [true, true]);
        assert.strictEqual(ftp.finishedUploads().length, 2);
    });
});
