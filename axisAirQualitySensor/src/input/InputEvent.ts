import * as EventEmitter from 'events';
import { spawn } from 'child_process';

export type InputEventData = {
    keycode: number;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
};

export class InputEvent extends EventEmitter {
    private usbKeycode = [
        0, 0, 0, 0, 30, 48, 46, 32, 18, 33, 34, 35, 23, 36, 37, 38, 50, 49, 24, 25, 16, 19, 31, 20, 22, 47, 17, 45, 21,
        44, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 28, 1, 14, 15, 57, 12, 13, 26, 27, 43, 43, 39, 40, 41, 51, 52, 53, 58, 59,
        60, 61, 62, 63, 64, 65, 66, 67, 68, 87, 88, 99, 70, 119, 110, 102, 104, 111, 107, 109, 106, 105, 108, 103, 69,
        98, 55, 74, 78, 96, 79, 80, 81, 75, 76, 77, 71, 72, 73, 82, 83, 86, 127, 116, 117, 183, 184, 185, 186, 187, 188,
        189, 190, 191, 192, 193, 194, 134, 138, 130, 132, 128, 129, 131, 137, 133, 135, 136, 113, 115, 114, 0, 0, 0,
        121, 0, 89, 93, 124, 92, 94, 95, 0, 0, 0, 122, 123, 90, 91, 85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 42, 56, 125, 97, 54, 100, 126, 164, 166,
        165, 163, 161, 115, 114, 113, 150, 158, 159, 128, 136, 177, 178, 176, 142, 152, 173, 140,
    ];

    constructor(private device: string) {
        super();
        EventEmitter.call(this);

        const fd = spawn('cat', [this.device]).stdout;

        let dataBuffer = Buffer.alloc(0);
        fd.on('data', (data) => {
            this.emit('raw', data);
            dataBuffer = Buffer.concat([dataBuffer, data]);
            while (dataBuffer.length >= 8) {
                const ctrl = (dataBuffer[0] & 1) !== 0 || ((dataBuffer[0] >> 4) & 1) !== 0;
                const shift = (dataBuffer[0] & 2) !== 0 || ((dataBuffer[0] >> 4) & 2) !== 0;
                const alt = (dataBuffer[0] & 4) !== 0 || ((dataBuffer[0] >> 4) & 4) !== 0;
                if (dataBuffer[2] !== 0) {
                    this.emit('data', { keycode: this.usbKeycode[dataBuffer[2]], ctrl, shift, alt });
                }
                dataBuffer = dataBuffer.subarray(8);
            }
        });

        fd.on('error', (err) => {
            this.emit('error', err);
        });

        fd.on('end', () => {
            this.emit('disconnect');
        });
    }
}
