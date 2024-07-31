import { setInterval } from 'timers/promises';
import { AxisCameraStationEvents } from 'camstreamerlib/events/AxisCameraStationEvents';

import { Widget } from './widget';
import { AxisEvents } from './events';
import { LuxMeterReader } from './LuxMeterReader';
import { TLuxmeter, readSettings } from './settings';

let widget: Widget | undefined;
let axisEvents: AxisEvents | undefined;
let acsEvents: AxisCameraStationEvents | undefined;

function sendEvent(type: 'low' | 'high') {
    if (axisEvents) {
        axisEvents.sendEvent(type);
    }

    if (acsEvents) {
        void acsEvents.sendEvent(type === 'low' ? 'Low intensity' : 'High intensity', 'lutron_luxmeter_integration');
    }
}

async function loop(lmr: LuxMeterReader, luxOpt: TLuxmeter) {
    let eventTimeout: NodeJS.Timeout | undefined;
    let low: boolean = false;

    for await (const c of setInterval(luxOpt.frequency)) {
        void c;
        const result = await lmr.readParsed();

        if (widget) {
            await widget.display(result);
        }

        if (luxOpt.low <= result.value && result.value <= luxOpt.high) {
            clearTimeout(eventTimeout);
            eventTimeout = undefined;
        } else if (result.value < luxOpt.low) {
            if (!low || eventTimeout === undefined) {
                low = true;
                eventTimeout = setTimeout(() => {
                    sendEvent('low');
                }, luxOpt.period);
            }
        } else if (result.value > luxOpt.high) {
            if (low || eventTimeout === undefined) {
                low = false;
                eventTimeout = setTimeout(() => {
                    sendEvent('high');
                }, luxOpt.period);
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

    await loop(lmr, settings.luxmeter);
}

main().catch((err) => console.error(err));
