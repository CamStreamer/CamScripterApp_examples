import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const cameraSchema = z.object({
    ip: z.string(),
    port: z.number(),
    auth: z.string(),
    tls: z.boolean(),
    tlsInsecure: z.boolean(),
});
const settingsSchema = z.object({
    cameras: cameraSchema.array(),

    x: z.number(),
    y: z.number(),
    scale: z.number(),
    period: z.number(),
    screenWidth: z.number(),
    screenHeight: z.number(),
    coAlignment: z.string(),
});

export type TCamera = z.infer<typeof cameraSchema>;
export type TSettings = z.infer<typeof settingsSchema>;

export function readSettings(): TSettings {
    const localdata = process.env.PERSISTENT_DATA_PATH ?? 'localdata';
    const data = fs.readFileSync(path.join(localdata, 'settings.json'));
    return settingsSchema.parse(JSON.parse(data.toString()));
}
