import { promisify } from 'util';
import { VapixAPI } from 'camstreamerlib/cjs';
import { DefaultClient } from 'camstreamerlib/cjs/node';
import { TServerData } from '../schema';
import { getCameraOptions } from '../utils';

const setTimeoutPromise = promisify(setTimeout);

const FLASH_INTERVAL_MS = 500;

export class LedIndicator {
    private vapix: VapixAPI;
    private startFlashesCount = 0;
    private greenLedIndicationTimeoutId: NodeJS.Timeout | null = null;
    private redLedIndicationTimeoutId: NodeJS.Timeout | null = null;
    private greenLedPort: number;
    private redLedPort: number;

    constructor(connHubSettings: TServerData['conn_hub'], private ledSettings: TServerData['led']) {
        const options = getCameraOptions(connHubSettings);
        const httpClient = new DefaultClient(options);
        this.vapix = new VapixAPI(httpClient);
        this.greenLedPort = ledSettings.led_green_port - 1; // Vapix API uses 0-based port numbering
        this.redLedPort = ledSettings.led_red_port - 1;
    }

    private async setGreenLedState(active: boolean) {
        try {
            await this.vapix.setPorts([
                {
                    port: this.greenLedPort.toString(),
                    state: active ? 'closed' : 'open',
                },
            ]);
        } catch (e) {
            console.warn('Green led error: If the problem persists, check your led configuration', e);
        }
    }

    private async setRedLedState(active: boolean) {
        try {
            await this.vapix.setPorts([
                {
                    port: this.redLedPort.toString(),
                    state: active ? 'closed' : 'open',
                },
            ]);
        } catch (e) {
            console.warn('Red led error: If the problem persists, check your led configuration', e);
        }
    }

    private async setBothLEDs(bothActive: boolean) {
        try {
            await this.vapix.setPorts([
                {
                    port: this.greenLedPort.toString(),
                    state: bothActive ? 'closed' : 'open',
                },
                {
                    port: this.redLedPort.toString(),
                    state: bothActive ? 'closed' : 'open',
                },
            ]);
        } catch (e) {
            console.warn('Red led error: Please check your led configuration', e);
        }
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
        try {
            if (this.greenLedIndicationTimeoutId) {
                clearTimeout(this.greenLedIndicationTimeoutId);
                this.greenLedIndicationTimeoutId = null;
            }
            if (this.redLedIndicationTimeoutId) {
                clearTimeout(this.redLedIndicationTimeoutId);
                this.redLedIndicationTimeoutId = null;
            }
            await this.setBothLEDs(false);
        } catch (e) {
            console.error('Led destructor error: ', e);
        }
    }
}
