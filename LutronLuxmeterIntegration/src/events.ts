import { TCamera } from './settings';
import { CamScripterAPICameraEventsGenerator } from 'camstreamerlib/CamScripterAPICameraEventsGenerator';

type EventGenerator = {
    csc: CamScripterAPICameraEventsGenerator;
    connected: boolean;
    eventDeclared: boolean;
};

export class AxisEvents {
    private cscArray: EventGenerator[];
    private reconnectTimer?: NodeJS.Timeout;

    constructor(cscConnectionParams: TCamera[]) {
        this.cscArray = [];
        for (const connection of cscConnectionParams) {
            const csc = new CamScripterAPICameraEventsGenerator(connection);
            const eg: EventGenerator = { csc, connected: false, eventDeclared: false };
            this.cscArray.push(eg);
            void this.prepareEvents(eg);
        }
    }

    sendEvent(text: string) {
        this.cscArray.forEach((eg) => {
            if (!eg.connected || !eg.eventDeclared) {
                console.error('AxisEvents: CSc API disconnected');
            }

            void eg.csc.sendEvent({
                declaration_id: 'lutron_luxmeter_integration',
                event_data: [
                    {
                        namespace: '',
                        key: 'code',
                        value: text,
                        value_type: 'STRING',
                    },
                ],
            });
        });
    }

    private async prepareEvents(eg: EventGenerator) {
        try {
            if (!(await this.connectCameraEvents(eg))) {
                throw new Error('Connection error');
            }

            if (!eg.eventDeclared) {
                await this.declareCameraEvent(eg.csc);
                eg.eventDeclared = true;
            }
        } catch (err) {
            console.error('AxisEvents: prepare event:', err);
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => this.prepareEvents(eg), 10000);
        }
    }

    async connectCameraEvents(eg: EventGenerator) {
        if (!eg.connected) {
            eg.csc.removeAllListeners();
            eg.csc.on('open', () => {
                console.log('CSc: connected');
                eg.connected = true;
            });

            eg.csc.on('error', (err) => {
                console.log('CSc-Error: ' + err);
            });

            eg.csc.on('close', () => {
                console.log('CSc-Error: connection closed');
                eg.connected = false;
                eg.eventDeclared = false;

                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = setTimeout(() => this.prepareEvents(eg), 10000);
            });

            await eg.csc.connect();
        }
        return eg.connected;
    }

    private async declareCameraEvent(csc: CamScripterAPICameraEventsGenerator) {
        await csc.declareEvent({
            declaration_id: 'lutron_luxmeter_integration',
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
                    value: 'lutron_luxmeter_integration',
                    value_type: 'STRING',
                    value_nice_name: 'CamScripter: Lutron Luxmeter integration',
                },
                {
                    type: 'DATA',
                    namespace: '',
                    key: 'code',
                    value: '',
                    value_type: 'STRING',
                    key_nice_name: 'Code',
                },
            ],
        });
    }
}
