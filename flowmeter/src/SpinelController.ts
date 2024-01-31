import * as fs from 'fs/promises';
import { z } from 'zod';
import { SpinelDevice } from './SpinelDevice';
import { EventEmitter } from 'events';

export const calibrationSchema = z.object({
    k_factor: z.number().positive(),
});
export type TCalibration = z.infer<typeof calibrationSchema>;

export const stateSchema = z.object({
    aggregated_volume: z.number().nonnegative(),
});
export type TState = z.infer<typeof stateSchema>;

export class SpinelController extends EventEmitter {
    private readonly VENDOR_ID = 0x0403;
    private readonly PRODUCT_ID = 0x6001;

    private spinel?: SpinelDevice;
    private restartTimer?: NodeJS.Timeout;
    private intervalTimer?: NodeJS.Timeout;
    private reportVolumeTimer?: NodeJS.Timeout;
    private calibration: TCalibration = { k_factor: 5509 };
    private state: TState = { aggregated_volume: 0 };
    private started = false;

    constructor() {
        super();
        void this.init();
    }

    private async init() {
        this.calibration = await this.readCalibration();
        this.state = await this.readState();
        this.reportVolume();
    }

    async start() {
        try {
            await this.stop();

            this.started = true;
            await this.init();

            this.spinel = new SpinelDevice(this.VENDOR_ID, this.PRODUCT_ID);
            await this.spinel.connect();
            await this.spinel.send97Request(0xfe, Buffer.from('6081', 'hex'));
            this.intervalTimer = setInterval(async () => {
                await this.getData();
            }, 1000);
        } catch (err) {
            console.error(err);
            await this.stop();
            this.restartTimer = setTimeout(() => this.start(), 5000);
        }
    }

    async stop() {
        this.started = false;
        clearTimeout(this.restartTimer);
        clearInterval(this.intervalTimer);
        if (this.spinel) {
            await this.spinel.close();
        }
    }

    isStarted() {
        return this.started;
    }

    async reset() {
        this.state.aggregated_volume = 0;
        await this.updateState(this.state);
        this.emit('volume', this.state.aggregated_volume);
    }

    async calibrationStart() {
        if (this.spinel) {
            await this.spinel.close();
        }
        this.spinel = new SpinelDevice(this.VENDOR_ID, this.PRODUCT_ID);
        await this.spinel.connect();
        await this.spinel.send97Request(0xfe, Buffer.from('6081', 'hex'));
    }

    async calibrationCalibrate(calibrationVolume: number) {
        if (calibrationVolume <= 0) {
            throw new Error('Calibration volume has to be greater than zero');
        }
        if (!this.spinel) {
            throw new Error('Spinel connection not found');
        }
        const data = await this.spinel.send97Request(0xfe, Buffer.from('6081', 'hex'));
        const volumeDelta = this.parseCounterData(data.data);
        if (volumeDelta === 0) {
            throw new Error('Some liquid has to be poured through flow meter for calibration');
        }

        this.calibration.k_factor = volumeDelta / calibrationVolume;
        await this.updateCalibration(this.calibration);
        await this.spinel.close();
    }

    private async getData() {
        try {
            if (this.spinel) {
                const data = await this.spinel.send97Request(0xfe, Buffer.from('6081', 'hex'));
                const volumeDelta = this.parseCounterData(data.data);
                this.state.aggregated_volume += volumeDelta / this.calibration.k_factor;
                await this.updateState(this.state);
                this.reportVolume();
            }
        } catch (err) {
            console.error(err);
            await this.stop();
            this.restartTimer = setTimeout(() => this.start(), 5000);
        }
    }

    private parseCounterData(data: Buffer) {
        let result = 0;
        const bytesCount = data[0] / 8;
        for (let i = 1; i < data.length; i += bytesCount) {
            let res = 0;
            for (let j = 0; j < bytesCount; j++) {
                res = res << 8;
                res += data[i + j];
            }
            result += res;
        }
        return result;
    }

    private async readCalibration(): Promise<TCalibration> {
        try {
            const fileData = await fs.readFile(process.env.PERSISTENT_DATA_PATH + 'calibration.json');
            return calibrationSchema.parse(JSON.parse(fileData.toString()));
        } catch (err) {
            console.error('Calibration lost, error: ', err);
            return { k_factor: 5509 };
        }
    }

    private async updateCalibration(state: TCalibration) {
        await fs.writeFile(process.env.PERSISTENT_DATA_PATH + 'calibration.json', JSON.stringify(state));
    }

    private async readState(): Promise<TState> {
        try {
            const fileData = await fs.readFile(process.env.PERSISTENT_DATA_PATH + 'state.json');
            return stateSchema.parse(JSON.parse(fileData.toString()));
        } catch (err) {
            console.error('Counter state lost, error: ', err);
            return { aggregated_volume: 0 };
        }
    }

    private async updateState(state: TState) {
        await fs.writeFile(process.env.PERSISTENT_DATA_PATH + 'state_tmp.json', JSON.stringify(state));
        await fs.rename(
            process.env.PERSISTENT_DATA_PATH + 'state_tmp.json',
            process.env.PERSISTENT_DATA_PATH + 'state.json'
        );
    }

    private reportVolume() {
        this.emit('volume', this.state.aggregated_volume);

        clearTimeout(this.reportVolumeTimer);
        this.reportVolumeTimer = setTimeout(() => this.reportVolume(), 5000);
    }
}
