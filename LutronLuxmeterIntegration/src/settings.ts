import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const connectionParams = {
    protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    ip: z.union([z.string().ip().default('127.0.0.1'), z.literal('')]),
    port: z.number().positive().lt(65535),
    user: z.string(),
    pass: z.string(),
};
const eventParams = {
    enabled: z.boolean(),
    triggerDelay: z.number().nonnegative(),
    repeatDelay: z.number().nonnegative(),
    value: z.number().nonnegative(),
    condition: z.union([
        z.literal('='),
        z.literal('<'),
        z.literal('<='),
        z.literal('>'),
        z.literal('>='),
        z.literal('<'),
    ]),
};

const cameraSchema = z.object({
    ...connectionParams,
    cameraList: z.number().array().nonempty(),
});
const acsSchema = z.object({
    ...connectionParams,
    ...eventParams,
    source_key: z.string(),
});
const eventSchema = z.object(eventParams);
const widgetSchema = z.object({
    enabled: z.boolean(),
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
    scale: z.number().positive(),
    screenWidth: z.number().nonnegative(),
    screenHeight: z.number().nonnegative(),
    coAlignment: z.union([
        z.literal('top_left'),
        z.literal('top_center'),
        z.literal('top_right'),
        z.literal('center_left'),
        z.literal('center'),
        z.literal('center_right'),
        z.literal('bottom_left'),
        z.literal('bottom_center'),
        z.literal('bottom_right'),
    ]),
});

const settingsSchema = z.object({
    updateFrequency: z.number(),
    cameras: cameraSchema.array(),
    acs: acsSchema.merge(eventSchema),
    lowEvent: eventSchema,
    highEvent: eventSchema,
    widget: widgetSchema,
});

export type TCamera = z.infer<typeof cameraSchema>;
export type TAcs = z.infer<typeof acsSchema>;
export type TEvent = z.infer<typeof eventSchema>;
export type TWidget = z.infer<typeof widgetSchema>;
export type TSettings = z.infer<typeof settingsSchema>;

function isConfigured(camera: TCamera): boolean {
    return camera.ip !== '' && camera.user !== '' && camera.pass !== '';
}
function convertSettings(settings: TSettings): void {
    settings.updateFrequency *= 1000;
    settings.lowEvent.triggerDelay *= 1000;
    settings.lowEvent.repeatDelay *= 1000;
    settings.highEvent.triggerDelay *= 1000;
    settings.highEvent.repeatDelay *= 1000;
    settings.acs.triggerDelay *= 1000;
    settings.acs.repeatDelay *= 1000;
    settings.widget.scale /= 100;
}
export function readSettings(): TSettings {
    const localdata = process.env.PERSISTENT_DATA_PATH ?? 'localdata';
    const buffer = fs.readFileSync(path.join(localdata, 'settings.json'));
    const data = settingsSchema.parse(JSON.parse(buffer.toString()));

    convertSettings(data);
    data.cameras = data.cameras.filter((camera) => isConfigured(camera));
    return data;
}
