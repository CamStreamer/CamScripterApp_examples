import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const luxmeterSchema = z.object({
    frequency: z.number(),
    low: z.number().positive().nullable(),
    high: z.number().positive().nullable(),
    period: z.number().positive().nullable(),
});
const cameraSchema = z.object({
    ip: z.string().ip(),
    port: z.number().positive().lt(65535),
    auth: z.string(),
    tls: z.boolean(),
    tlsInsecure: z.boolean(),
});
const widgetSchema = z.object({
    x: z.number(),
    y: z.number(),
    scale: z.number(),
    screenWidth: z.number(),
    screenHeight: z.number(),
    coAlignment: z.string(),
});
const axisEventSchema = z.object({
    enabled: z.boolean(),
});
const acsSchema = z.object({
    enabled: z.boolean(),
    tls: z.boolean(),
    tlsInsecure: z.boolean(),
    ip: z.string().ip(),
    port: z.number().positive().lt(65535),
    auth: z.string(),
    source_key: z.string(),
});

const settingsSchema = z.object({
    luxmeter: luxmeterSchema,
    cameras: cameraSchema.array(),
    widget: widgetSchema,
    events: axisEventSchema,
    acs: acsSchema
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
