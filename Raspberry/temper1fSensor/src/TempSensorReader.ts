import * as glob from 'fast-glob';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

const readFilePr = util.promisify(fs.readFile);
const openFdPr = util.promisify(fs.open);
const closeFdPr = util.promisify(fs.close);
const readFdPr = util.promisify(fs.read);
const writeFdPr = util.promisify(fs.write);

export type SensorData = {
    firmware: string;
    temp: number;
    humidity: number;
};

type UsbDevice = {
    vendorId: number;
    productId: number;
    manufacturer: string;
    product: string;
    busnum: number;
    devnum: number;
    devices: string[];
};

export class TempSensorReader {
    private usbDevices: UsbDevice[] = [];

    async readSensorData(): Promise<SensorData> {
        if (this.usbDevices.length === 0) {
            this.usbDevices = await this.getUsbDevices();
        }

        for (let usbDevice of this.usbDevices) {
            const sensorData = await this.readDeviceData(usbDevice);
            return sensorData;
        }
        throw new Error(`Could not read sensor data, usb devices found: ${this.usbDevices.length}`);
    }

    private async getUsbDevices() {
        const sysPath = '/sys/bus/usb/devices';
        const usbDeviceDirList = await glob(`${sysPath}/*`, {
            deep: 1,
            onlyDirectories: true,
            absolute: true,
        });

        let usbDevices: UsbDevice[] = [];
        for (let usbDeviceDir of usbDeviceDirList) {
            const vendorId = parseInt(await this.readDeviceInfoFile(path.join(usbDeviceDir, 'idVendor')), 16);
            const productId = parseInt(await this.readDeviceInfoFile(path.join(usbDeviceDir, 'idProduct')), 16);
            const manufacturer = await this.readDeviceInfoFile(path.join(usbDeviceDir, 'manufacturer'));
            const product = await this.readDeviceInfoFile(path.join(usbDeviceDir, 'product'));
            const busnum = parseInt(await this.readDeviceInfoFile(path.join(usbDeviceDir, 'busnum')));
            const devnum = parseInt(await this.readDeviceInfoFile(path.join(usbDeviceDir, 'devnum')));

            if (isNaN(vendorId) || isNaN(productId) || !this.isKnownDevice(vendorId, productId)) {
                continue;
            }

            const devices = await this.findDevices(usbDeviceDir);
            if (devices.length == 0) {
                continue;
            }

            usbDevices.push({ vendorId, productId, manufacturer, product, busnum, devnum, devices });
        }
        return usbDevices;
    }

    private async findDevices(usbDeviceDir: string) {
        const deviceList = await glob(`${usbDeviceDir}/**/hidraw[0123456789]`, {
            onlyDirectories: true,
            followSymbolicLinks: false,
            absolute: true,
            unique: true,
        });
        return deviceList.map((device) => path.basename(device));
    }

    private isKnownDevice(vendorId: number, productId: number) {
        if (vendorId == 0x0c45 && productId == 0x7401) {
            return true;
        }
        if (vendorId == 0x413d && productId == 0x2107) {
            return true;
        }
        if (vendorId == 0x1a86 && productId == 0x5523) {
            return true;
        }
        return false;
    }

    private async readDeviceInfoFile(path: string) {
        try {
            const fileData = await readFilePr(path);
            return fileData.toString();
        } catch (err) {
            // Ignore errors
            return '';
        }
    }

    private async readDeviceData(usbDevice: UsbDevice): Promise<SensorData> {
        const devicePath = path.join('/dev', usbDevice.devices[usbDevice.devices.length - 1]);
        const fd = await openFdPr(devicePath, 'r+');

        // Read firmware
        await writeFdPr(fd, Buffer.from('0186ff0100000000', 'hex'));
        const firmwareBuffer = await this.readWithTimeout(fd, 9, 200);
        const firmware = firmwareBuffer.toString('latin1').trim();

        // Read temperature / humidity
        await writeFdPr(fd, Buffer.from('0180330100000000', 'hex'));
        if (firmware.indexOf('TEMPerF1.4') !== -1) {
            const dataBytes = await this.readWithTimeout(fd, 8, 200);
            return {
                firmware,
                temp: this.parseBytes(2, 256.0, dataBytes),
                humidity: 0,
            };
        } else if (firmware.indexOf('TEMPerGold_V3.1') !== -1) {
            const dataBytes = await this.readWithTimeout(fd, 8, 200);
            return {
                firmware,
                temp: this.parseBytes(2, 100.0, dataBytes),
                humidity: 0,
            };
        } else if (firmware.indexOf('TEMPerX_V3.1') !== -1 || firmware.indexOf('TEMPerX_V3.3') !== -1) {
            const dataBytes = await this.readWithTimeout(fd, 16, 200);
            if (dataBytes.length >= 16) {
                // Both internal and external sensors exist
                return {
                    firmware,
                    temp: this.parseBytes(10, 100.0, dataBytes),
                    humidity: this.parseBytes(12, 100.0, dataBytes),
                };
            } else if (dataBytes.length >= 8) {
                // Only external sensor exists
                return {
                    firmware,
                    temp: this.parseBytes(2, 100.0, dataBytes),
                    humidity: this.parseBytes(4, 100.0, dataBytes),
                };
            }
        } else {
            throw new Error('Unknown firmware: ' + firmware);
        }

        await closeFdPr(fd);
    }

    private readWithTimeout(fd: number, minRequiredSize: number, timeoutMs: number) {
        return new Promise<Buffer>(async (resolve) => {
            let outputBuffer = Buffer.alloc(0);
            let timeout = false;
            for (let i = 0; i < 10; i++) {
                const timeoutTimer = setTimeout(() => {
                    timeout = true;
                    closeFdPr(fd);
                    resolve(outputBuffer);
                }, timeoutMs);

                const buffer = Buffer.alloc(1024);
                const deviceData = await readFdPr(fd, buffer, 0, buffer.length, 0);
                outputBuffer = Buffer.concat([outputBuffer, deviceData.buffer.subarray(0, deviceData.bytesRead)]);
                clearTimeout(timeoutTimer);

                if (timeout) {
                    break;
                }

                if (outputBuffer.length >= minRequiredSize) {
                    resolve(outputBuffer);
                    break;
                }
            }
        });
    }

    private parseBytes(offset: number, divisor: number, bytes: Buffer) {
        /*Data is returned from several devices in a similar format. In the first
        8 bytes, the internal sensors are returned in bytes 2 and 3 (temperature)
        and in bytes 4 and 5 (humidity). In the second 8 bytes, external sensor
        information is returned. If there are only external sensors, then only 8
        bytes are returned, and the caller is expected to use the correct 'name'.
        The caller is also expected to detect the firmware version and provide the
        appropriate divisor, which is usually 100 or 256.*/
        if (bytes[offset] == 0x4e && bytes[offset + 1] == 0x20) {
            return 0;
        }

        return bytes.readInt16BE(offset) / divisor;
    }
}
