import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import * as assert from 'assert';
import { FakeCamera } from './helpers/fakeCamera';
import { FakeFtp } from './helpers/fakeFtp';
import { delay } from './helpers/deferred';
import { CLOSING_BARCODE, createScheduler, SERIAL_NUMBER, STARTING_BARCODE, TSutOptions } from './helpers/sut';

const ACCIDENTAL_READ_WINDOW_MS = 3000;

describe('start/stop recording rules', () => {
    let camera: FakeCamera;
    let ftp: FakeFtp;
    let cameraPort: number;
    let now: number;

    beforeEach(async () => {
        camera = new FakeCamera();
        cameraPort = await camera.start();
        ftp = new FakeFtp();
        ftp.install();
        now = 1_700_000_000_000;
        mock.method(Date, 'now', () => now);
    });

    afterEach(async () => {
        ftp.release();
        mock.restoreAll();
        await camera.stop();
    });

    const create = (options: Omit<TSutOptions, 'cameraPort'>) => createScheduler({ cameraPort, ...options });

    const afterAccidentalReadWindow = () => {
        now += ACCIDENTAL_READ_WINDOW_MS;
    };

    const recordedCodes = () =>
        ftp.finishedUploads().map((upload) => {
            const match = upload.path.match(new RegExp(`_([A-Z0-9]+)_${SERIAL_NUMBER}_camera\\d+\\.mkv$`));
            assert.ok(match, `unexpected upload path ${upload.path}`);
            return match[1];
        });

    describe('with a closing barcode', () => {
        const options = { closingBarcodeEnabled: true };

        it('ignores the closing barcode when nothing is recording', async () => {
            const scheduler = create(options);
            assert.strictEqual(await scheduler.scan(CLOSING_BARCODE), true);
            assert.strictEqual(scheduler.isRecording(), false);
            assert.deepStrictEqual(recordedCodes(), []);
        });

        it('starts on any code and uploads it on the closing barcode', async () => {
            const scheduler = create(options);
            assert.strictEqual(scheduler.isRecording(), false);
            assert.strictEqual(await scheduler.scan('CODE1'), undefined);
            assert.strictEqual(scheduler.isRecording(), true);
            assert.deepStrictEqual(recordedCodes(), []);

            assert.strictEqual(await scheduler.scan(CLOSING_BARCODE), true);
            assert.strictEqual(scheduler.isRecording(), false);
            assert.deepStrictEqual(recordedCodes(), ['CODE1']);
        });

        it('ignores other codes while recording', async () => {
            const scheduler = create(options);
            await scheduler.scan('CODE1');
            assert.strictEqual(await scheduler.scan('CODE2'), undefined);
            afterAccidentalReadWindow();
            assert.strictEqual(await scheduler.scan('CODE1'), undefined);
            assert.strictEqual(scheduler.isRecording(), true);
            assert.deepStrictEqual(recordedCodes(), []);

            await scheduler.scan(CLOSING_BARCODE);
            assert.deepStrictEqual(recordedCodes(), ['CODE1']);
        });

        it('records the same code again after the closing barcode', async () => {
            const scheduler = create(options);
            await scheduler.scan('CODE1');
            await scheduler.scan(CLOSING_BARCODE);
            await scheduler.scan('CODE1');
            await scheduler.scan(CLOSING_BARCODE);
            assert.deepStrictEqual(recordedCodes(), ['CODE1', 'CODE1']);
        });
    });

    describe('without any control barcode', () => {
        const options = { closingBarcodeEnabled: false };

        it('stops on the same code without starting again', async () => {
            const scheduler = create(options);
            await scheduler.scan('CODE1');
            afterAccidentalReadWindow();
            assert.strictEqual(await scheduler.scan('CODE1'), true);
            assert.strictEqual(scheduler.isRecording(), false);
            assert.deepStrictEqual(recordedCodes(), ['CODE1']);
        });

        it('starts the same code again on the next scan after stopping', async () => {
            const scheduler = create(options);
            await scheduler.scan('CODE1');
            afterAccidentalReadWindow();
            await scheduler.scan('CODE1');
            await scheduler.scan('CODE1');
            assert.strictEqual(scheduler.isRecording(), true);
            afterAccidentalReadWindow();
            await scheduler.scan('CODE1');
            assert.deepStrictEqual(recordedCodes(), ['CODE1', 'CODE1']);
        });

        it('stops the recording and starts the next one on a new code', async () => {
            const scheduler = create(options);
            await scheduler.scan('CODE1');
            await scheduler.scan('CODE2');
            assert.strictEqual(scheduler.isRecording(), true);
            await scheduler.scan('CODE3');
            assert.deepStrictEqual(recordedCodes(), ['CODE1', 'CODE2']);
        });

        it('reports the closed recording when a new code starts the next one', async () => {
            const scheduler = create(options);
            await scheduler.scan('CODE1');
            assert.strictEqual(await scheduler.scan('CODE2'), true);
            ftp.failNextUploads = 1;
            assert.strictEqual(await scheduler.scan('CODE3'), false);
            assert.strictEqual(scheduler.isRecording(), true);
        });
    });

    describe('with a starting barcode', () => {
        const options = { closingBarcodeEnabled: false, startingBarcodeEnabled: true };

        it('ignores every code but the starting barcode when nothing is recording', async () => {
            const scheduler = create(options);
            assert.strictEqual(await scheduler.scan('CODE1'), true);
            assert.strictEqual(await scheduler.scan(CLOSING_BARCODE), true);
            assert.strictEqual(scheduler.isRecording(), false);

            await scheduler.scan(STARTING_BARCODE);
            assert.strictEqual(scheduler.isRecording(), true);
        });

        it('ignores other codes while recording', async () => {
            const scheduler = create(options);
            await scheduler.scan(STARTING_BARCODE);
            await scheduler.scan('CODE1');
            await scheduler.scan(CLOSING_BARCODE);
            assert.strictEqual(scheduler.isRecording(), true);
            assert.deepStrictEqual(recordedCodes(), []);
        });
    });

    describe('with both a starting and a closing barcode', () => {
        const options = { closingBarcodeEnabled: true, startingBarcodeEnabled: true };

        it('starts only on the starting barcode and stops only on the closing barcode', async () => {
            const scheduler = create(options);
            await scheduler.scan('CODE1');
            await scheduler.scan(CLOSING_BARCODE);
            assert.strictEqual(scheduler.isRecording(), false);

            await scheduler.scan(STARTING_BARCODE);
            afterAccidentalReadWindow();
            await scheduler.scan(STARTING_BARCODE);
            await scheduler.scan('CODE1');
            assert.strictEqual(scheduler.isRecording(), true);
            assert.deepStrictEqual(recordedCodes(), []);

            assert.strictEqual(await scheduler.scan(CLOSING_BARCODE), true);
            assert.strictEqual(scheduler.isRecording(), false);
            assert.deepStrictEqual(recordedCodes(), [STARTING_BARCODE]);
        });
    });

    describe('accidental re-read of the code that started the recording', () => {
        it('is ignored and hidden within the window', async () => {
            const scheduler = create({ closingBarcodeEnabled: false });
            await scheduler.scan('CODE1');
            now += ACCIDENTAL_READ_WINDOW_MS - 1;

            assert.strictEqual(scheduler.shouldShowBarcode('CODE1'), false);
            assert.strictEqual(scheduler.shouldShowBarcode('CODE2'), true);
            assert.strictEqual(await scheduler.scan('CODE1'), undefined);
            assert.strictEqual(scheduler.isRecording(), true);
            assert.deepStrictEqual(recordedCodes(), []);
        });

        it('counts as a normal scan once the window has passed', async () => {
            const scheduler = create({ closingBarcodeEnabled: false });
            await scheduler.scan('CODE1');
            afterAccidentalReadWindow();

            assert.strictEqual(scheduler.shouldShowBarcode('CODE1'), true);
            await scheduler.scan('CODE1');
            assert.deepStrictEqual(recordedCodes(), ['CODE1']);
        });

        it('applies to the starting barcode', async () => {
            const scheduler = create({ closingBarcodeEnabled: false, startingBarcodeEnabled: true });
            await scheduler.scan(STARTING_BARCODE);
            assert.strictEqual(await scheduler.scan(STARTING_BARCODE), undefined);
            assert.strictEqual(scheduler.isRecording(), true);
            assert.deepStrictEqual(recordedCodes(), []);
        });
    });

    describe('timeout', () => {
        it('uploads the recording on timeout and ignores the closing barcode afterwards', async () => {
            const scheduler = create({ closingBarcodeEnabled: true, timeoutSec: 0.2 });
            await scheduler.scan('CODE1');
            await delay(500);
            assert.deepStrictEqual(recordedCodes(), ['CODE1']);

            assert.strictEqual(await scheduler.scan(CLOSING_BARCODE), true);
            assert.deepStrictEqual(recordedCodes(), ['CODE1']);
        });

        it('lets the same code start a new recording after a timeout', async () => {
            const scheduler = create({ closingBarcodeEnabled: true, timeoutSec: 0.2 });
            await scheduler.scan('CODE1');
            await delay(500);
            await scheduler.scan('CODE1');
            await scheduler.scan(CLOSING_BARCODE);
            assert.deepStrictEqual(recordedCodes(), ['CODE1', 'CODE1']);
        });

        it('is cancelled by the closing barcode', async () => {
            const scheduler = create({ closingBarcodeEnabled: true, timeoutSec: 0.2 });
            await scheduler.scan('CODE1');
            await scheduler.scan(CLOSING_BARCODE);
            await delay(500);
            assert.deepStrictEqual(recordedCodes(), ['CODE1']);
        });
    });
});
