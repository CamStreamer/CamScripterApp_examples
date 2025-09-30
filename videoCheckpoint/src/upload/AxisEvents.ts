import { TConnectionParams } from '../schema';
import { CamScripterAPICameraEventsGenerator } from 'camstreamerlib/cjs/CamScripterAPICameraEventsGenerator';

export class AxisEvents {
    private csc: CamScripterAPICameraEventsGenerator;
    private cscEventDeclared = false;

    constructor(cscConnectionParams: TConnectionParams) {
        this.csc = new CamScripterAPICameraEventsGenerator({
            tls: cscConnectionParams.protocol !== 'http',
            tlsInsecure: cscConnectionParams.protocol === 'https_insecure',
            ip: cscConnectionParams.ip,
            port: cscConnectionParams.port,
            user: cscConnectionParams.user,
            pass: cscConnectionParams.pass,
        });
        this.connectCameraEvents();
    }

    sendEvent(text: string) {
        if (!this.cscEventDeclared) {
            throw new Error('AxisEvents: CSc API disconnected');
        }

        return this.csc.sendEvent({
            declaration_id: 'VideoCheckpoint',
            event_data: [
                {
                    namespace: '',
                    key: 'code',
                    value: text,
                    value_type: 'STRING',
                },
            ],
        });
    }

    connectCameraEvents() {
        this.csc.removeAllListeners();
        this.csc.on('open', async () => {
            try {
                console.log('CSc: connected');
                await this.declareCameraEvent();
                this.cscEventDeclared = true;
            } catch (err) {
                console.error('AxisEvents: connectCameraEvents:', err);
            }
        });

        this.csc.on('error', (err) => {
            console.log('CSc-Error: ' + err);
        });

        this.csc.on('close', () => {
            console.log('CSc-Error: connection closed');
            this.cscEventDeclared = false;
        });

        this.csc.connect();
    }

    private async declareCameraEvent() {
        await this.csc.declareEvent({
            declaration_id: 'VideoCheckpoint',
            stateless: true,
            declaration: [
                {
                    namespace: 'tnsaxis',
                    key: 'topic0',
                    value: 'CameraApplicationPlatform',
                    value_type: 'STRING',
                },
                {
                    namespace: 'tnsaxis',
                    key: 'topic1',
                    value: 'CamScripter',
                    value_type: 'STRING',
                },
                {
                    namespace: 'tnsaxis',
                    key: 'topic2',
                    value: 'VideoCheckpoint',
                    value_type: 'STRING',
                    value_nice_name: 'CamScripter: VideoCheckpoint Code',
                },
                {
                    type: 'DATA',
                    namespace: '',
                    key: 'code',
                    value: '',
                    value_type: 'STRING',
                    key_nice_name: 'Code',
                    value_nice_name: 'Code read by HW reader',
                },
            ],
        });
    }
}
