import * as EventEmitter from 'events';
import { spawn } from 'child_process';

export class InputEvent extends EventEmitter {
    constructor(private device: string) {
        super();
        EventEmitter.call(this);
        const fd = spawn('cat', [this.device]).stdout;

        let dataBuffer = Buffer.alloc(0);
        fd.on('data', async (data: Buffer) => {
            dataBuffer = Buffer.concat([dataBuffer, data]);

            const dataSplited = dataBuffer.toString().split(/[\r, \n]/);
            if (dataSplited.length > 1) {
                this.emit('final_bar_code', dataSplited[0]);
                dataBuffer = Buffer.from(dataSplited[dataSplited.length - 1]);
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
