import { TCamera } from './settings';
import { CamScripterAPICameraEventsGenerator } from 'camstreamerlib/CamScripterAPICameraEventsGenerator';

type EventGenerator = {
    csc: CamScripterAPICameraEventsGenerator;
    connected: boolean;
    eventDeclared: boolean;
};

const packageName: string = process.env.PACKAGE_NAME ?? 'lutron_luxmeter_integration';

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

    sendEvent(type: 'low' | 'high') {
        this.cscArray.forEach((eg) => {
            if (!eg.connected || !eg.eventDeclared) {
                console.error('AxisEvents: CSc API disconnected');
            }

            eg.csc
                .sendEvent({
                    declaration_id: packageName + '_' + type,
                    event_data: [
                        {
                            namespace: '',
                            key: 'intensity_alarm',
                            value: type === 'low' ? 'Low intensity' : 'High intensity',
                            value_type: 'STRING',
                        },
                    ],
                })
                .catch((err) => {
                    console.error(err);
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
        const type: Record<string, string> = {
            _low: 'Low intensity',
            _high: 'HIgh intensity',
        };
        for (const event of ['_low', '_high']) {
            await csc.declareEvent({
                declaration_id: packageName + event,
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
                        value: packageName + event,
                        value_type: 'STRING',
                        value_nice_name: 'CamScripter: Lutron Luxmeter integration (' + type[event] + ')',
                    },
                    {
                        type: 'DATA',
                        namespace: '',
                        key: 'intensity_alarm',
                        key_nice_name: type[event] + ' alarm',
                        value: '',
                        value_type: 'STRING',
                    },
                ],
            });
        }
    }
}
