import { setInterval } from 'timers/promises';
import { AxisCameraStationEvents, AcsEventsOptions } from 'camstreamerlib/events/AxisCameraStationEvents';

import { Widget } from './Widget';
import { AxisEvents } from './AxisEvents';
import { LuxMeterReader, TResult } from './LuxMeterReader';
import { readSettings, TEvent } from './settings';

let widget: Widget | undefined;
let axisEvents: AxisEvents | undefined;
let acsEvents: AxisCameraStationEvents | undefined;

function sendAcsEvent(result: TResult): void {
    const message = {
        Intensity: result.value.toString(),
        Unit: result.unit,
    };

    acsEvents?.sendEvent(message, 'lutron_luxmeter_integration').catch((err) => console.error(err));
}

function compare(measuredValue: number, triggerValue: number, condition: '=' | '<' | '<=' | '>' | '>='): boolean {
    switch (condition) {
        case '=':
            return measuredValue === triggerValue;
        case '<':
            return measuredValue < triggerValue;
        case '<=':
            return measuredValue <= triggerValue;
        case '>':
            return measuredValue > triggerValue;
        case '>=':
            return measuredValue >= triggerValue;
    }
}

async function loop(lmr: LuxMeterReader, updateFrequency: number, lowEvent: TEvent, highEvent: TEvent, acs: TEvent) {
    let lowEventTimeout: NodeJS.Timeout | undefined;
    let highEventTimeout: NodeJS.Timeout | undefined;
    let acsEventTimeout: NodeJS.Timeout | undefined;

    for await (const c of setInterval(updateFrequency)) {
        void c;
        const result = await lmr.readParsed();

        if (widget) {
            try {
                await widget.display(result);
            } catch (err) {
                console.error(err);
            }
        }

        if (lowEvent.enabled) {
            if (compare(result.value, lowEvent.value, lowEvent.condition)) {
                if (lowEventTimeout === undefined) {
                    const triggerEvent = () => {
                        axisEvents?.sendEvent('low');
                        if (lowEvent.repeatDelay > 0) {
                            lowEventTimeout = setTimeout(triggerEvent, lowEvent.repeatDelay);
                        }
                    };
                    lowEventTimeout = setTimeout(() => triggerEvent(), lowEvent.triggerDelay);
                }
            } else {
                clearTimeout(lowEventTimeout);
                lowEventTimeout = undefined;
            }
        }
        if (highEvent.enabled) {
            if (compare(result.value, highEvent.value, highEvent.condition)) {
                if (highEventTimeout === undefined) {
                    const triggerEvent = () => {
                        axisEvents?.sendEvent('high');
                        if (highEvent.repeatDelay > 0) {
                            highEventTimeout = setTimeout(triggerEvent, highEvent.repeatDelay);
                        }
                    };
                    highEventTimeout = setTimeout(() => triggerEvent(), highEvent.triggerDelay);
                }
            } else {
                clearTimeout(highEventTimeout);
                highEventTimeout = undefined;
            }
        }
        if (acs.enabled) {
            if (compare(result.value, acs.value, acs.condition)) {
                if (acsEventTimeout === undefined) {
                    const triggerEvent = () => {
                        sendAcsEvent(result);
                        if (acs.repeatDelay > 0) {
                            acsEventTimeout = setTimeout(triggerEvent, acs.repeatDelay);
                        }
                    };
                    acsEventTimeout = setTimeout(() => triggerEvent(), acs.triggerDelay);
                }
            } else {
                clearTimeout(acsEventTimeout);
                acsEventTimeout = undefined;
            }
        }
    }
}

async function main() {
    const settings = readSettings();
    const lmr = await LuxMeterReader.connect();

    if (settings.widget.enabled) {
        widget = new Widget(settings.widget, settings.cameras);
    }

    if (settings.lowEvent.enabled || settings.highEvent.enabled) {
        axisEvents = new AxisEvents(settings.cameras);
    }

    if (settings.acs.enabled) {
        const options: AcsEventsOptions = {
            ...settings.acs,
            tls: settings.acs.protocol !== 'http',
            tlsInsecure: settings.acs.protocol !== 'https',
        };
        acsEvents = new AxisCameraStationEvents(settings.acs.source_key, options);
    }

    await loop(lmr, settings.updateFrequency, settings.lowEvent, settings.highEvent, settings.acs);
}

process.on('uncaughtException', (error) => {
    console.warn('uncaughtException', error);
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    console.warn('unhandledRejection', error);
    process.exit(1);
});
void main();
