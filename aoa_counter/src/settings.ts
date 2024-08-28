import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const cameraSchema = z.object({
    protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    ip: z.string(),
    port: z.number(),
    user: z.string(),
    pass: z.string(),
    serviceID: z.number(),
    fieldName: z.string(),
});
const aoaSchema = z.object({
    updateFrequency: z.number(),
    scenarioId: z.string(),
    method: z.union([z.literal('getOccupancy'), z.literal('getAccumulatedCounts ')]),
});
const settingsSchema = z.object({
    camera: cameraSchema,
    aoa: aoaSchema,
});

export type TCamera = z.infer<typeof cameraSchema>;
export type TAoa = z.infer<typeof aoaSchema>;
export type TSettings = z.infer<typeof settingsSchema>;

export function readSettings(): TSettings {
    const localdata = process.env.PERSISTENT_DATA_PATH ?? 'localdata';
    const buffer = fs.readFileSync(path.join(localdata, 'settings.json'));
    return settingsSchema.parse(JSON.parse(buffer.toString()));
}
