import { promisify } from 'util';
import { CameraVapix } from 'camstreamerlib/CameraVapix';
import { TServerData } from '../schema';

const setTimeoutPromise = promisify(setTimeout);

const FLASH_INTERVAL_MS = 500;

export class LedIndicator {
    private cameraVapix: CameraVapix;
    private startFlashesCount = 0;
    private greenLedIndicationTimeoutId: NodeJS.Timeout | null = null;
    private redLedIndicationTimeoutId: NodeJS.Timeout | null = null;

    constructor(connHubSettings: TServerData['conn_hub'], private ledSettings: TServerData['led']) {
        const options = {
            tls: connHubSettings.protocol !== 'http',
            tlsInsecure: connHubSettings.protocol === 'https_insecure',
            ip: connHubSettings.ip,
            port: connHubSettings.port,
            user: connHubSettings.user,
            pass: connHubSettings.pass,
        };
        this.cameraVapix = new CameraVapix(options);
    }

    private async setGreenLedState(active: boolean) {
        try {
            if (this.ledSettings.led_green_port !== undefined) {
                await this.cameraVapix.setOutputState(this.ledSettings.led_green_port, active);
            }
        } catch (e) {
            console.warn('Green led error: If the problem persists, check your led configuration', e);
        }
    }

    private async setRedLedState(active: boolean) {
        try {
            if (this.ledSettings.led_red_port !== undefined) {
                await this.cameraVapix.setOutputState(this.ledSettings.led_red_port, active);
            }
        } catch (e) {
            console.warn('Red led error: If the problem persists, check your led configuration', e);
        }
    }

    private async setBothLEDs(bothActive: boolean) {
        await Promise.all([this.setGreenLedState(bothActive), this.setRedLedState(bothActive)]);
    }

    private async greenFlash() {
        await this.setGreenLedState(true);
        await setTimeoutPromise(50);
        await this.setGreenLedState(false);
    }

    private async redFlash() {
        await this.setRedLedState(true);
        await setTimeoutPromise(50);
        await this.setRedLedState(false);
    }

    // Runs on script start, checks wheather led settings is ok
    async indicateOnScriptStart() {
        const t1 = Date.now();
        this.startFlashesCount++;
        await this.greenFlash();
        await this.redFlash();
        const t2 = Date.now();
        if (this.startFlashesCount < 3) {
            setTimeout(() => this.indicateOnScriptStart(), Math.max(0, FLASH_INTERVAL_MS - (t2 - t1)));
        }
    }

    private async abortLed(led: 'success' | 'failure') {
        if (led === 'success' && this.greenLedIndicationTimeoutId) {
            clearTimeout(this.greenLedIndicationTimeoutId);
            this.greenLedIndicationTimeoutId = null;
            await this.setGreenLedState(false);
        } else if (led === 'failure' && this.redLedIndicationTimeoutId) {
            clearTimeout(this.redLedIndicationTimeoutId);
            this.redLedIndicationTimeoutId = null;
            await this.setRedLedState(false);
        }
    }

    async indicateSuccess(ms: number, repeatTimes: number) {
        await this.abortLed('failure');
        for (let i = 0; i < repeatTimes; i++) {
            await this.setGreenLedState(true);
            await setTimeoutPromise(ms);
            await this.setGreenLedState(false);
            if (i < 1) {
                await setTimeoutPromise(100);
            }
        }
    }

    async indicateFailure(ms: number, repeatTimes: number) {
        await this.abortLed('success');
        for (let i = 0; i < repeatTimes; i++) {
            await this.setRedLedState(true);
            await setTimeoutPromise(ms);
            await this.setRedLedState(false);
            if (i < 1) {
                await setTimeoutPromise(100);
            }
        }
    }

    async destructor() {
        if (this.greenLedIndicationTimeoutId) {
            clearTimeout(this.greenLedIndicationTimeoutId);
            this.greenLedIndicationTimeoutId = null;
        }
        if (this.redLedIndicationTimeoutId) {
            clearTimeout(this.redLedIndicationTimeoutId);
            this.redLedIndicationTimeoutId = null;
        }
        await this.setBothLEDs(false);
    }
}
