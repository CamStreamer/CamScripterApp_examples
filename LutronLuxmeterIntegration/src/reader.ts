import * as fs from 'fs/promises';
import { SerialPort } from 'serialport';

export type TResult = { value: number; unit: string };

const bufferSize = 16;
const STX = 2;
const LF = 10;

export class LuxMeterReader {
    private device: fs.FileHandle | undefined;
    private last = Buffer.alloc(0);

    private constructor() {}
    private async findLuxMeter(): Promise<void> {
        const list = await SerialPort.list();

        for (const port of list) {
            this.device = await fs.open(port.path, 'r');
            const buf = await this.read();

            if (this.validResponse(buf)) {
                this.last = buf;
                void this.readLoop();
                return;
            } else {
                void this.device.close();
            }
        }

        throw new Error('No Lux meter found.');
    }
    static async connect() {
        const lmr = new LuxMeterReader();
        await lmr.findLuxMeter();
        return lmr;
    }

    private validResponse(buf: Buffer): boolean {
        const zeroCode = '0'.charCodeAt(0);
        const nineCode = '9'.charCodeAt(0);

        if (buf[0] !== STX || buf.at(-1) !== LF) {
            return false;
        }
        for (let f = 1; f < bufferSize - 1; f += 1) {
            if (zeroCode > buf[f] || buf[f] > nineCode) {
                return false;
            }
        }

        return true;
    }
    private async readLoop() {
        for (;;) {
            this.last = await this.read();
        }
    }
    async read(): Promise<Buffer> {
        let buf = Buffer.alloc(0);
        const byte = Buffer.alloc(1);
        do {
            await this.device!.read(byte, 0, 1, null);
            buf = Buffer.concat([buf, byte]);
        } while (byte.at(0) !== LF);

        return buf;
    }
    readParsed(): TResult {
        const s = this.last.toString();
        const value = Number.parseInt(s.substring(7, 15));
        const decimalPointPosition = Number.parseInt(s[6]);
        const unit = Number.parseInt(s.substring(3, 5));

        return {
            value: value * Math.pow(10, -decimalPointPosition),
            unit: unit === 15 ? 'Lux' : 'Ft-cd',
        };
    }
}
