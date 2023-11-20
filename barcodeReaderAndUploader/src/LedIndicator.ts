import { CameraVapix, CameraVapixOptions } from 'camstreamerlib/CameraVapix';

import { promisify } from 'util';
import { settings } from './settings';

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

    constructor(private readonly indicatorSettings: TLedIndicatorSettings) {
        const cameraVapixOptions: CameraVapixOptions = {
            ip: indicatorSettings.camera.ip,
            port: indicatorSettings.camera.port,
            auth: `${indicatorSettings.camera.user}:${indicatorSettings.camera.pass}`,
            tls: indicatorSettings.camera.protocol !== 'http',
            tlsInsecure: indicatorSettings.camera.protocol === 'https_insecure',
        };

        this.cameraVapix = new CameraVapix(cameraVapixOptions);
    }

    async getGreenLedState() {
        return await this.cameraVapix.getInputState(this.indicatorSettings.ledSettings.greenPort);
    }

    async getRedLedState() {
        return await this.cameraVapix.getInputState(this.indicatorSettings.ledSettings.redPort);
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

    async indicateSuccess() {
        if (this.greenLedIndicationTimeoutId) {
            clearTimeout(this.greenLedIndicationTimeoutId);
            await this.setGreenLedState(false);
            // blink to indicate change of successfull proccess in progress
            await setTimeoutPromise(500);
        }

        this.setGreenLedState(true);
        this.greenLedIndicationTimeoutId = setTimeout(() => {
            this.setGreenLedState(false);
            this.greenLedIndicationTimeoutId = null;
        }, STATE_INDICATION_DURATION_MS);
    }

    async indicateFailure() {
        if (this.redLedIndicationTimeoutId) {
            clearTimeout(this.redLedIndicationTimeoutId);
            await this.setRedLedState(false);
            // blink to indicate change of failed proccess in progress
            await setTimeoutPromise(500);
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
        }
        if (this.greenLedIndicationTimeoutId) {
            clearTimeout(this.greenLedIndicationTimeoutId);
        }
        if (this.redLedIndicationTimeoutId) {
            clearTimeout(this.redLedIndicationTimeoutId);
        }
        await this.setBothLEDs(false);
    }
}
