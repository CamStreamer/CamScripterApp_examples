import { TConnectionParams } from './schema';
import { CamScripterAPICameraEventsGenerator } from 'camstreamerlib/CamScripterAPICameraEventsGenerator';

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

    sendEvent(active: boolean) {
        if (!this.cscEventDeclared) {
            throw new Error('AxisEvents: CSc API disconnected');
        }

        return this.csc.sendEvent({
            declaration_id: 'WeighingScaleIntegration',
            event_data: [
                {
                    namespace: '',
                    key: 'condition_active',
                    value: active,
                    value_type: 'BOOL',
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
            declaration_id: 'WeighingScaleIntegration',
            stateless: false,
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
                    value: 'WeighingScaleIntegration',
                    value_type: 'STRING',
                    value_nice_name: 'CamScripter: WeighingScaleIntegration',
                },
                {
                    type: 'DATA',
                    namespace: '',
                    key: 'condition_active',
                    value: false,
                    value_type: 'BOOL',
                    key_nice_name: 'React on active condition (settings in the script)',
                    value_nice_name: 'Condition is active',
                },
            ],
        });
    }
}
