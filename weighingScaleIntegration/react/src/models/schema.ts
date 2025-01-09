import { z } from 'zod';

export const connectionParamsSchema = z.object({
    protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    ip: z.union([z.string().ip(), z.literal('')]),
    port: z.number().positive().lt(65535),
    user: z.string(),
    pass: z.string(),
});

export type TConnectionParams = z.infer<typeof connectionParamsSchema>;

export const applicationSchema = z.object({
    acs: connectionParamsSchema.merge(
        z.object({
            source_key: z.string(),
            active: z.boolean(),
            condition_delay: z.number().int(),
            condition_operator: z.number().int().min(0).max(4),
            condition_value: z.coerce.string(),
            repeat_after: z.number().min(0),
        })
    ),
    camera: connectionParamsSchema.merge(
        z.object({
            service_id: z.number(),
            value_field_name: z.string(),
            unit_field_name: z.string(),
        })
    ),
    event_camera: connectionParamsSchema.merge(
        z.object({
            active: z.boolean(),
            condition_delay: z.number().int(),
            condition_operator: z.number().int().min(0).max(4),
            condition_value: z.coerce.string(),
        })
    ),
    scale: z.object({
        ip: z.union([z.string().ip(), z.literal('')]),
        port: z.number().positive().lt(65535),
        refresh_rate: z.number().positive(),
    }),
});

export type TAppSchema = z.infer<typeof applicationSchema>;
