import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { PortInfo } from '@serialport/bindings-interface';

export type TSpinelData = {
    format: number;
    byteCount: number;
    data: Buffer;
    address: number;
    sign: number;
    ack: number;
};

export class SpinelDevice {
    private vendorIdStr: string;
    private productIdStr: string;
    private serialPort?: SerialPort;
    private buffer = Buffer.alloc(0);
    private requests: Record<number, (responseData: TSpinelData) => void> = {};

    constructor(vendorID: number, productID: number) {
        this.vendorIdStr = SpinelDevice.deviceIdToString(vendorID);
        this.productIdStr = SpinelDevice.deviceIdToString(productID);
    }

    async connect() {
        const list = await SerialPort.list();
        console.log('device list:', JSON.stringify(list));

        let ourPort: PortInfo | undefined;
        for (const port of list) {
            if (port['vendorId'] === this.vendorIdStr && port['productId'] === this.productIdStr) {
                ourPort = port;
            }
        }
        if (!ourPort) {
            throw new Error('404 no device found!');
        }

        this.serialPort = new SerialPort({
            path: ourPort.path,
            baudRate: 115200,
        });
        const delimiterParser = this.serialPort.pipe(
            new DelimiterParser({
                delimiter: '\r',
                includeDelimiter: true,
            })
        );
        delimiterParser.on('data', (rawData: string) => {
            this.buffer = Buffer.concat([this.buffer, Buffer.from(rawData)]);
            this.parseDataBuffer();
        });
    }

    private parseDataBuffer() {
        if (this.buffer.length < 4) {
            // Not enough data for parsing
            return;
        }
        if (this.buffer[0] === 0x2a) {
            switch (this.buffer[1]) {
                case 0x61: {
                    const byteCount = (this.buffer[2] << 8) + this.buffer[3] + 4;
                    if (byteCount <= this.buffer.length) {
                        // Data are complete
                        const checksum = this.buffer[byteCount - 2];
                        const dataload = this.buffer.subarray(0, byteCount - 2);
                        this.buffer = this.buffer.subarray(byteCount);
                        if (this.checksum(dataload) === checksum) {
                            this.accept97Request(dataload);
                        } else {
                            throw new Error(
                                'Spinell Parse Error - Bad Checksum. ' +
                                    `Recived: ${checksum} Expected: ${this.checksum(dataload)}`
                            );
                        }
                    }
                    break;
                }
                default:
                    throw new Error('Spinell Parse Error - Unknown Format');
            }
        } else {
            throw new Error('Spinel Parse Error - Unknown Protocol');
        }
    }

    send97Request(addr: number, sdataBuff: Buffer, timeout = 5000) {
        const sign = Math.floor(Math.random() * 256);
        return new Promise<TSpinelData>((resolve, reject) => {
            this.send97Data(addr, sign, sdataBuff);
            this.requests[sign] = resolve;
            setTimeout(() => reject(new Error('Request timeout')), timeout);
        });
    }

    private send97Data(addr: number, sign: number, sdataBuff: Buffer) {
        const instruction = this.assemble97Instruction(addr, sign, sdataBuff);
        this.sendData(instruction);
    }

    private assemble97Instruction(addr: number, sign: number, sdataBuff: Buffer) {
        const bCount = sdataBuff.length + 4;
        const pre = Buffer.from([0x2a, 0x61, (bCount & 0xff00) >> 8, bCount & 0xff, addr, sign]);
        const load = Buffer.concat([pre, sdataBuff]);
        const suffix = Buffer.from([this.checksum(load), 0x0d]);
        return Buffer.concat([load, suffix]);
    }

    private accept97Request(dataload: Buffer) {
        const outJson: TSpinelData = {
            format: dataload[1],
            byteCount: (dataload[2] << 8) + dataload[3],
            data: dataload.subarray(7),
            address: dataload[4],
            sign: dataload[5],
            ack: dataload[6],
        };
        if (outJson.sign in this.requests) {
            this.requests[outJson.sign](outJson);
        }
    }

    private sendData(buffer: Buffer) {
        if (this.serialPort) {
            this.serialPort.write(buffer, (err) => {
                if (err) {
                    throw new Error(`Error on spinel write: ${err.message}`);
                }
            });
        }
    }

    private checksum(buff: Buffer) {
        const base = 255;
        let sum = 0x00;
        for (let i = 0; i < buff.length; i++) {
            sum = (sum + buff[i]) & 0xff;
        }
        return (base - sum) & 0xff;
    }

    async close() {
        try {
            if (this.serialPort) {
                this.serialPort.unpipe();
                this.serialPort.removeAllListeners();
                this.serialPort.destroy();
                if (this.serialPort?.isOpen) {
                    await this.serialPort.close();
                }
            }
            console.log('serial port closed');
        } catch (err) {
            console.log('serial port close error:', err);
        }
    }

    private static deviceIdToString(deviceId: number) {
        let deviceIdStr = deviceId.toString(16);
        if (deviceIdStr.length < 4) {
            for (let i = 0; i < 4 - deviceIdStr.length; i++) {
                deviceIdStr = '0' + deviceIdStr;
            }
        }
        return deviceIdStr;
    }
}
