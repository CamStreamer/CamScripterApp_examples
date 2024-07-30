import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const luxmeterSchema = z.object({
    frequency: z.number(),
    low: z.number().nonnegative().default(0),
    high: z.number().nonnegative().default(Number.MAX_VALUE),
    period: z.number().nonnegative().default(0),
});
const cameraSchema = z.object({
    tls: z.boolean(),
    tlsInsecure: z.boolean(),
    ip: z.string().ip(),
    port: z.number().positive().lt(65535),
    user: z.string(),
    pass: z.string(),
});
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
const axisEventSchema = z.object({
    enabled: z.boolean(),
});
const acsSchema = z.object({
    enabled: z.boolean(),
    tls: z.boolean(),
    tlsInsecure: z.boolean(),
    ip: z.union([z.string().ip(), z.literal('')]),
    port: z.number().positive().lt(65535),
    user: z.string(),
    pass: z.string(),
    source_key: z.string(),
});

const settingsSchema = z.object({
    luxmeter: luxmeterSchema,
    cameras: cameraSchema.array(),
    widget: widgetSchema,
    events: axisEventSchema,
    acs: acsSchema,
});

export type TLuxmeter = z.infer<typeof luxmeterSchema>;
export type TCamera = z.infer<typeof cameraSchema>;
export type TWidget = z.infer<typeof widgetSchema>;
export type TAxisEvent = z.infer<typeof axisEventSchema>;
export type TAcs = z.infer<typeof acsSchema>;
export type TSettings = z.infer<typeof settingsSchema>;

export function readSettings(): TSettings {
    const localdata = process.env.PERSISTENT_DATA_PATH ?? 'localdata';
    const data = fs.readFileSync(path.join(localdata, 'settings.json'));
    return settingsSchema.parse(JSON.parse(data.toString()));
}
