import { z } from 'zod';

const connectionParams = {
    protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    ip: z.string(),
    port: z.number(),
    user: z.string(),
    pass: z.string(),
};
export const cameraSchema = z.object({
    ...connectionParams,
    serviceID: z.number(),
    fieldName: z.string(),
});
export const aoaSchema = z.object({
    ...connectionParams,
    updateFrequency: z.number(),
    scenarioId: z.number(),
    method: z.union([z.literal('getOccupancy'), z.literal('getAccumulatedCounts')]),
});
export const settingsSchema = z.object({
    camera: cameraSchema,
    aoa: aoaSchema,
});

export type TCamera = z.infer<typeof cameraSchema>;
export type TAoa = z.infer<typeof aoaSchema>;
export type TSettings = z.infer<typeof settingsSchema>;
