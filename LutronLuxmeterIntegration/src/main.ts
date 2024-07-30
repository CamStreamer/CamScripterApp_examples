import { setInterval } from 'timers/promises';

import { Widget } from './widget';
import { AxisEvents } from './events';
import { LuxMeterReader } from './reader';
import { TLuxmeter, readSettings } from './settings';

let widget: Widget | undefined;
let axisEvents: AxisEvents | undefined;

async function loop(lmr: LuxMeterReader, luxOpt: TLuxmeter) {
    let eventTimeout: NodeJS.Timeout | undefined;
    let low: boolean = false;

    for await (const c of setInterval(luxOpt.frequency)) {
        void c;
        const result = await lmr.readParsed();

        if (widget) {
            await widget.display(result);
        }

        if (axisEvents) {
            if (luxOpt.low <= result.value && result.value <= luxOpt.high) {
                clearTimeout(eventTimeout);
                eventTimeout = undefined;
            } else if (result.value < luxOpt.low) {
                if (!low || eventTimeout === undefined) {
                    low = true;
                    eventTimeout = setTimeout(() => {
                        axisEvents?.sendEvent('low');
                    }, luxOpt.period);
                }
            } else if (result.value > luxOpt.high) {
                if (low || eventTimeout === undefined) {
                    low = false;
                    eventTimeout = setTimeout(() => {
                        axisEvents?.sendEvent('high');
                    }, luxOpt.period);
                }
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

    await loop(lmr, settings.luxmeter);
}

main().catch((err) => console.error(err));
