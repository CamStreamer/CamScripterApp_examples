import { afterEach, beforeEach, describe, it } from 'node:test';
import * as assert from 'assert';
import { FakeCamera } from './helpers/fakeCamera';
import { MiniFtpServer } from './helpers/miniFtpServer';
import { createScheduler, recordVideo, SERIAL_NUMBER } from './helpers/sut';

const images = [{ camera: 0, file: Buffer.from('image-1') }];

describe('uploads through the real basic-ftp client', () => {
    let camera: FakeCamera;
    let ftp: MiniFtpServer;
    let cameraPort: number;
    let ftpPort: number;

    beforeEach(async () => {
        camera = new FakeCamera();
        cameraPort = await camera.start();
        ftp = new MiniFtpServer();
        ftpPort = await ftp.start();
    });

    afterEach(async () => {
        await ftp.stop();
        await camera.stop();
    });

    it('stores the exact bytes the camera exported', async () => {
        camera.exportBehaviour = { chunks: 64, chunkSize: 16 * 1024, chunkIntervalMs: 1 };
        const scheduler = createScheduler({ cameraPort, ftpPort });
        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), true);

        const files = ftp.completeFiles();
        assert.strictEqual(files.length, 1);
        assert.strictEqual(files[0].bytes.length, camera.expectedExportBytes());
        assert.strictEqual(camera.exports[0].finished, true);
    });

    it('recovers from a transfer the server aborts', async () => {
        camera.exportBehaviour = { chunks: 200, chunkSize: 16 * 1024, chunkIntervalMs: 5 };
        ftp.abortNextTransfersAfterBytes = 64 * 1024;
        const scheduler = createScheduler({ cameraPort, ftpPort });

        assert.strictEqual(await recordVideo(scheduler, 'CODE1'), false);
        await camera.exports[0].closedEarly;
        assert.strictEqual(camera.exports[0].finished, false);

        camera.exportBehaviour = { chunks: 4 };
        assert.strictEqual(await recordVideo(scheduler, 'CODE2'), true);
        assert.strictEqual(ftp.logins, 2, 'the client did not reconnect after the aborted transfer');
        assert.strictEqual(ftp.completeFiles().length, 1);
        assert.match(ftp.completeFiles()[0].path, /_CODE2_/);
    });

    it('serialises image and video uploads on one connection', async () => {
        camera.exportBehaviour = { chunks: 20, chunkIntervalMs: 10 };
        const scheduler = createScheduler({ cameraPort, ftpPort });

        const [videoResult, imageResult] = await Promise.all([
            recordVideo(scheduler, 'CODE1'),
            scheduler.ftpServer.queueImageUpload('CODE2', images, SERIAL_NUMBER),
        ]);

        assert.deepStrictEqual([videoResult, imageResult], [true, true]);
        assert.strictEqual(ftp.completeFiles().length, 2);
        assert.strictEqual(ftp.logins, 1);
    });
});
