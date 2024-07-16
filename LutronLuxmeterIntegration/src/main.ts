import { setInterval } from 'timers/promises';

import { Widget } from './widget';
import { readSettings } from './settings';
import { LuxMeterReader } from './reader';

async function loop(w: Widget, lmr: LuxMeterReader, period: number) {
    for await (const c of setInterval(period)) {
        const result = await lmr.readParsed();
        console.log(result);
        await w.display();
    }
}

async function main() {
    const settings = readSettings();
    const lmr = await LuxMeterReader.connect();
    const w = new Widget(settings, settings.cameras[0], settings.scale);

    await loop(w, lmr, settings.period);
}

main().catch((err) => console.error(err));
