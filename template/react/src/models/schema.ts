import { z } from 'zod';

export const connectionParamsSchema = z.object({
    protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    ip: z.union([z.string().ip(), z.literal('')]),
    port: z.number().positive().lt(65535),
    user: z.string(),
    pass: z.string(),
});
export type TConnectionParams = z.infer<typeof connectionParamsSchema>;

export const settingsSchema = z.object({
    camera: connectionParamsSchema.merge(
        z.object({
            update_frequency: z.number(),
            port_id: z.string(),
        })
    ),
    output_camera: connectionParamsSchema.merge(
        z.object({
            field_name: z.string(),
            service_id: z.string(),
        })
    ),
});
export type TSettings = z.infer<typeof settingsSchema>;
