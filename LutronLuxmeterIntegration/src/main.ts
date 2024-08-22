import { setInterval } from 'timers/promises';
import { AxisCameraStationEvents } from 'camstreamerlib/events/AxisCameraStationEvents';

import { Widget } from './Widget';
import { AxisEvents } from './AxisEvents';
import { LuxMeterReader } from './LuxMeterReader';
import { readSettings, TEvent } from './settings';

let widget: Widget | undefined;
let axisEvents: AxisEvents | undefined;
let acsEvents: AxisCameraStationEvents | undefined;

function sendEvent(type: 'low' | 'high'): void {
    if (axisEvents) {
        try {
            axisEvents.sendEvent(type);
        } catch (err) {
            console.error(err);
        }
    }

    if (acsEvents) {
        const message = {
            Code: type === 'low' ? 'Low intensity' : 'High intensity',
        };

        acsEvents.sendEvent(message, 'lutron_luxmeter_integration').catch((err) => console.error(err));
    }
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

async function loop(lmr: LuxMeterReader, updateFrequency: number, lowEvent: TEvent, highEvent: TEvent) {
    let lowEventTimeout: NodeJS.Timeout | undefined;
    let highEventTimeout: NodeJS.Timeout | undefined;

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

        if (lowEvent.enabled && lowEventTimeout === undefined) {
            if (compare(result.value, lowEvent.value, lowEvent.condition)) {
                const triggerEvent = () => {
                    sendEvent('low');
                    if (lowEvent.repeatDelay > 0) {
                        lowEventTimeout = setTimeout(triggerEvent, lowEvent.repeatDelay);
                    }
                };
                lowEventTimeout = setTimeout(() => triggerEvent(), lowEvent.triggerDelay);
            } else {
                clearTimeout(lowEventTimeout);
                lowEventTimeout = undefined;
            }
        }
        if (highEvent.enabled && highEventTimeout === undefined) {
            if (compare(result.value, highEvent.value, highEvent.condition)) {
                const triggerEvent = () => {
                    sendEvent('low');
                    if (highEvent.repeatDelay > 0) {
                        highEventTimeout = setTimeout(triggerEvent, highEvent.repeatDelay);
                    }
                };
                highEventTimeout = setTimeout(() => triggerEvent(), highEvent.triggerDelay);
            } else {
                clearTimeout(highEventTimeout);
                highEventTimeout = undefined;
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

    if (settings.events.enabled) {
        axisEvents = new AxisEvents(settings.cameras);
    }

    if (settings.acs.enabled) {
        acsEvents = new AxisCameraStationEvents(settings.acs.source_key, settings.acs);
    }

    await loop(lmr, settings.updateFrequency, settings.lowEvent, settings.highEvent);
}

process.on('uncaughtException', (error) => {
    console.warn(error);
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    console.warn(error);
    process.exit(1);
});
void main();
