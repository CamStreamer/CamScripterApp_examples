import * as EventEmitter from 'events';
import * as glob from 'fast-glob';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { InputEvent, InputEventData } from './inputEvent';
import { keyCodeInfo } from './linuxKeyInfo';

const readFilePr = util.promisify(fs.readFile);

type UsbDevice = {
    vendorId: number;
    productId: number;
    manufacturer: string;
    product: string;
    busnum: number;
    devnum: number;
    devices: Device[];
};

type Device = {
    name: string;
    interfaceClass: number;
    interfaceSubClass: number;
    interfaceProtocol: number;
};

export class KeyboardReader extends EventEmitter {
    constructor() {
        super();
        EventEmitter.call(this);
        this.start();
    }

    private async start() {
        const usbDevices = await this.getUsbDevices();
        for (const usbDevice of usbDevices) {
            for (const device of usbDevice.devices) {
                // Only keyboards
                if (device.interfaceClass === 3 && device.interfaceProtocol === 1) {
                    this.openInput(path.join('/dev', device.name));
                }
            }
        }
    }

    private async getUsbDevices() {
        const sysPath = '/sys/bus/usb/devices';
        const usbDeviceDirList = await glob(`${sysPath}/*`, {
            deep: 1,
            onlyDirectories: true,
            absolute: true,
        });

        const usbDevices: UsbDevice[] = [];
        for (let usbDeviceDir of usbDeviceDirList) {
            try {
                const vendorId = parseInt(await this.readInfoFile(path.join(usbDeviceDir, 'idVendor')), 16);
                const productId = parseInt(await this.readInfoFile(path.join(usbDeviceDir, 'idProduct')), 16);
                const manufacturer = await this.readInfoFile(path.join(usbDeviceDir, 'manufacturer'));
                const product = await this.readInfoFile(path.join(usbDeviceDir, 'product'));
                const busnum = parseInt(await this.readInfoFile(path.join(usbDeviceDir, 'busnum')));
                const devnum = parseInt(await this.readInfoFile(path.join(usbDeviceDir, 'devnum')));

                if (isNaN(vendorId) || isNaN(productId)) {
                    continue;
                }

                const devices = await this.findDevices(usbDeviceDir);
                if (devices.length == 0) {
                    continue;
                }

                usbDevices.push({
                    vendorId,
                    productId,
                    manufacturer,
                    product,
                    busnum,
                    devnum,
                    devices,
                });
            } catch (err) {
                console.error('find usb device: ', err);
            }
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

        const outputDeviceList: Device[] = [];
        for (const device of deviceList) {
            const deviceRelativeDir = device.replace(usbDeviceDir, '').split('/');
            const interfacePath = path.join(usbDeviceDir, deviceRelativeDir[1]);

            outputDeviceList.push({
                name: path.basename(device),
                interfaceClass: parseInt(await this.readInfoFile(path.join(interfacePath, 'bInterfaceClass'))),
                interfaceSubClass: parseInt(await this.readInfoFile(path.join(interfacePath, 'bInterfaceSubClass'))),
                interfaceProtocol: parseInt(await this.readInfoFile(path.join(interfacePath, 'bInterfaceProtocol'))),
            });
        }
        return outputDeviceList;
    }

    private async readInfoFile(path: string) {
        try {
            const fileData = await readFilePr(path);
            return fileData.toString();
        } catch (err) {
            // Ignore errors
            return '';
        }
    }

    private openInput(devInput: string) {
        const input = new InputEvent(devInput);
        input.on('data', (event) => this.processEvent(event));
        input.on('disconnect', () => setTimeout(() => this.openInput(devInput), 5000));
    }

    private processEvent(event: InputEventData) {
        const keyInfo = keyCodeInfo(event.keycode, event.shift);
        this.emit('key_pressed', keyInfo);
    }
}
