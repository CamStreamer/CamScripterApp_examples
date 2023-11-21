import * as EventEmitter from 'events';

import { InputEvent } from './InputEvent';
import { CameraVapix } from 'camstreamerlib/CameraVapix';
import { settings } from '../settings';
import { DrawWidget } from '../DrawWidget/DrawWidget';

export class PortReader extends EventEmitter {
    drawWidget: DrawWidget;
    cv: CameraVapix;
    constructor() {
        super();
        EventEmitter.call(this);
        this.cv = new CameraVapix({
            ip: settings.camera.ip,
            port: settings.camera.port,
            auth: settings.camera.user + ':' + settings.camera.pass,
        });
        this.start();
    }

    private start = async () => {
        const portParam = await this.cv.getParameterGroup('Sersrvd');
        const deviceId = portParam['root.Sersrvd.COM2.Device'];
        this.openInput(deviceId);
    };

    private openInput(devInput: string) {
        const input = new InputEvent(devInput);
        input.on('final_bar_code', (event) => this.processEvent(event));
        input.on('disconnect', () => setTimeout(() => this.openInput(devInput), 5000));
    }

    private processEvent(data: string) {
        this.emit('final_bar_code', data);
    }
}
