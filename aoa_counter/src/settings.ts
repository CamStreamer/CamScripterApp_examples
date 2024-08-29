import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const connectionParams = {
    protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    ip: z.string(),
    port: z.number(),
    user: z.string(),
    pass: z.string(),
};
const cameraSchema = z.object({
    ...connectionParams,
    serviceID: z.number(),
    fieldName: z.string(),
});
const aoaSchema = z.object({
    ...connectionParams,
    updateFrequency: z.number(),
    scenarioId: z.number(),
    method: z.union([z.literal('getOccupancy'), z.literal('getAccumulatedCounts')]),
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
