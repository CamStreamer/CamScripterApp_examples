import { CameraVapix, CameraVapixOptions } from 'camstreamerlib/CameraVapix';

import { promisify } from 'util';
import { getCameraHttpSettings, settings } from './settings';

const setTimeoutPromise = promisify(setTimeout);

type TLedIndicatorSettings = Pick<typeof settings, 'camera' | 'ledSettings'>;

const START_INDICATION_DURATION_MS = 3000;
const FLASH_INTERVAL_MS = 500;
const STATE_INDICATION_DURATION_MS = 5000;

export class LedIndicator {
    cameraVapix: CameraVapix;

    private flashInterval: NodeJS.Timeout | null = null;
    private greenLedIndicationTimeoutId: NodeJS.Timeout | null = null;
    private redLedIndicationTimeoutId: NodeJS.Timeout | null = null;
    private abortSuccess = false;
    private abortFailure = false;

    constructor(private readonly indicatorSettings: TLedIndicatorSettings) {
        this.cameraVapix = new CameraVapix(getCameraHttpSettings());
    }

    private async setGreenLedState(active: boolean) {
        return await this.cameraVapix.setOutputState(this.indicatorSettings.ledSettings.greenPort, active);
    }

    private async setRedLedState(active: boolean) {
        return await this.cameraVapix.setOutputState(this.indicatorSettings.ledSettings.redPort, active);
    }

    private async setBothLEDs(bothActive: boolean) {
        await Promise.all([this.setGreenLedState(bothActive), this.setRedLedState(bothActive)]);
    }

    // runs on script start, checks wheather led settings are ok
    async indicateOnScriptStart() {
        const flash = async () => {
            await this.setBothLEDs(true);
            await this.setBothLEDs(false);
        };

        this.flashInterval = setInterval(() => {
            flash();
        }, FLASH_INTERVAL_MS);

        setTimeout(() => {
            if (this.flashInterval) {
                clearInterval(this.flashInterval);
                this.flashInterval = null;
            }
        }, START_INDICATION_DURATION_MS);
    }

    private abortLed(led: 'success' | 'failure') {
        if (led === 'success' && this.greenLedIndicationTimeoutId) {
            clearTimeout(this.greenLedIndicationTimeoutId);
            this.greenLedIndicationTimeoutId = null;
            this.setGreenLedState(false);
            this.abortSuccess = true;
        } else if (led === 'failure' && this.redLedIndicationTimeoutId) {
            clearTimeout(this.redLedIndicationTimeoutId);
            this.redLedIndicationTimeoutId = null;
            this.setRedLedState(false);
            this.abortFailure = true;
        }
    }

    private async indicateSuccessiveSameLedSignal(led: 'success' | 'failure') {
        if (led === 'success' && this.greenLedIndicationTimeoutId) {
            clearTimeout(this.greenLedIndicationTimeoutId);
            this.greenLedIndicationTimeoutId = null;

            // blink to indicate change of successfull proccess in progress
            await this.setGreenLedState(false);
            await setTimeoutPromise(500);
        } else if (led === 'failure' && this.redLedIndicationTimeoutId) {
            clearTimeout(this.redLedIndicationTimeoutId);
            this.redLedIndicationTimeoutId = null;

            // blink to indicate change of failed proccess in progress
            await this.setRedLedState(false);
            await setTimeoutPromise(500);
        }
    }

    async indicateSuccess(ms: number) {
        this.abortLed('failure');

        await this.indicateSuccessiveSameLedSignal('success');

        if (this.abortSuccess) {
            this.abortSuccess = false;
            return;
        }

        this.setGreenLedState(true);
        this.greenLedIndicationTimeoutId = setTimeout(() => {
            this.setGreenLedState(false);
            this.greenLedIndicationTimeoutId = null;
        }, ms);
    }

    async indicateFailure() {
        this.abortLed('success');

        await this.indicateSuccessiveSameLedSignal('failure');

        if (this.abortFailure) {
            this.abortFailure = false;
            return;
        }

        this.setRedLedState(true);
        this.redLedIndicationTimeoutId = setTimeout(() => {
            this.setRedLedState(false);
            this.redLedIndicationTimeoutId = null;
        }, STATE_INDICATION_DURATION_MS);
    }

    async destructor() {
        if (this.flashInterval) {
            clearInterval(this.flashInterval);
            this.flashInterval = null;
        }
        if (this.greenLedIndicationTimeoutId) {
            clearTimeout(this.greenLedIndicationTimeoutId);
            this.greenLedIndicationTimeoutId = null;
        }
        if (this.redLedIndicationTimeoutId) {
            clearTimeout(this.redLedIndicationTimeoutId);
            this.redLedIndicationTimeoutId = null;
        }
        this.abortSuccess = false;
        this.abortFailure = false;
        await this.setBothLEDs(false);
    }
}
