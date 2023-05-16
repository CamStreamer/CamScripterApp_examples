import * as EventEmitter from 'events';
import { KeyboardReader } from './keyboardReader';
import { KeyInfo } from './linuxKeyInfo';

export class QRCodeReader extends EventEmitter {
    private keyboardReader = new KeyboardReader();
    private code = '';

    constructor() {
        super();
        EventEmitter.call(this);
        this.keyboardReader.on('key_pressed', (keyInfo) => this.keyPressedCallback(keyInfo));
    }

    private keyPressedCallback(keyInfo: KeyInfo) {
        if (keyInfo.name !== 'ENTER') {
            this.code += keyInfo.char;
            return;
        }

        if (this.code.length !== 0) {
            this.emit('valid_reading', { code: this.code });
        }
        this.code = '';
    }
}
