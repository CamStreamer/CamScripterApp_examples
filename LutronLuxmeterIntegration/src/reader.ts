import * as fs from 'fs/promises';
import { SerialPort } from 'serialport';

export type TResult = { value: number; unit: string };

const bufferSize = 16;

export class LuxMeterReader {
    private path = '';
    private validResponse(buf: Buffer): boolean {
        const STX = 2;
        const LF = 10;
        const zeroCode = '0'.charCodeAt(0);
        const nineCode = '9'.charCodeAt(0);

        if (buf.length !== bufferSize || buf[0] !== STX || buf.at(-1) !== LF) {
            return false;
        }
        for (let f = 1; f < bufferSize - 1; f += 1) {
            if (zeroCode > buf[f] || buf[f] > nineCode) {
                return false;
            }
        }

        return true;
    }
    private async findLuxMeter(): Promise<void> {
        const list = await SerialPort.list();

        for (const port of list) {
            const buf = await this.read(port.path);

            if (this.validResponse(buf)) {
                this.path = port.path;
                return;
            }
        }

        throw new Error('No Lux meter found.');
    }

    private constructor() {}
    static async connect() {
        const lmr = new LuxMeterReader();
        await lmr.findLuxMeter();
        return lmr;
    }

    async read(path?: string): Promise<Buffer> {
        path ??= this.path;
        const buf = Buffer.alloc(bufferSize);

        const device = await fs.open(path ?? '', 'r');
        await device.read(buf, 0, bufferSize);
        void device.close();
        return buf;
    }
    async readParsed(): Promise<TResult> {
        const s = (await this.read()).toString();
        const value = Number.parseInt(s.substring(7, 15));
        const decimalPointPosition = Number.parseInt(s[6]);
        const unit = Number.parseInt(s.substring(3, 5));

        return {
            value: value * Math.pow(10, -decimalPointPosition),
            unit: unit === 15 ? 'Lux' : 'Ft-cd',
        };
    }
}
