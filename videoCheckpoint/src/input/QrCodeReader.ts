import * as EventEmitter from 'events';
import { KeyboardReader } from './KeyboardReader';
import { KeyInfo } from './linuxKeyInfo';

export type TReading = { code: string };

export class QRCodeReader extends EventEmitter {
    private keyboardReader: KeyboardReader;
    private code = '';

    constructor(private validationRule: string) {
        super();
        EventEmitter.call(this);

        this.keyboardReader = new KeyboardReader();
        this.keyboardReader.on('key_pressed', (keyInfo) => this.keyPressedCallback(keyInfo));
    }

    private keyPressedCallback(keyInfo: KeyInfo) {
        if (keyInfo.name !== 'ENTER') {
            this.code += keyInfo.char;
            return;
        }

        if (this.validate()) {
            this.emit('valid_reading', { code: this.code });
        } else {
            this.emit('invalid_reading', { code: this.code });
        }

        this.code = '';
    }

    private validate() {
        if (this.code.length === 0) {
            return false;
        }
        if (this.validationRule.length !== 0 && this.code.match(this.validationRule) === null) {
            return false;
        }
        return true;
    }
}
