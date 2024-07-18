import { z } from 'zod';

export const cameraServerSchema = z.object({
    tls: z.boolean(),
    tlsInsecure: z.boolean(),
    ip: z.string().ip(),
    port: z.number().positive().lt(65535),
    auth: z.string(),
});
export const acsServerSchema = z.object({
    enabled: z.boolean(),
    tls: z.boolean(),
    tlsInsecure: z.boolean(),
    ip: z.string().ip(),
    port: z.number().positive().lt(65535),
    auth: z.string(),
    source_key: z.string(),
});

export const luxmeterSchema = z.object({
    frequency: z.number().positive(),
    low: z.number().positive().nullable(),
    high: z.number().positive().nullable(),
    period: z.number().positive().nullable(),
});
export const cameraSchema = z.object({
    protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    ip: z.string().ip(),
    port: z.number().positive().lt(65535),
    user: z.string(),
    pass: z.string(),
});
export const widgetSchema = z.object({
    enabled: z.boolean(),
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
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
    scale: z.number().positive(),
    screenWidth: z.number().nonnegative(),
    screenHeight: z.number().nonnegative(),
});
export const axisEventSchema = z.object({
    enabled: z.boolean(),
});
export const acsSchema = z.object({
    enabled: z.boolean(),
    protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    ip: z.string().ip(),
    port: z.number().positive().lt(65535),
    user: z.string(),
    pass: z.string(),
    source_key: z.string(),
});

export const serverDataSchema = z.object({
    luxmeter: luxmeterSchema,
    cameras: cameraSchema.array(),
    widget: widgetSchema,
    events: axisEventSchema,
    acs: acsSchema,
});

export type TLuxMeter = z.infer<typeof luxmeterSchema>;
export type TCamera = z.infer<typeof cameraSchema>;
export type TWidget = z.infer<typeof widgetSchema>;
export type TAxisEvent = z.infer<typeof axisEventSchema>;
export type TacsSchema = z.infer<typeof acsSchema>;

export type TServerData = z.infer<typeof serverDataSchema>;

export type TCameraServer = z.infer<typeof cameraServerSchema>;
export type TAcsServer = z.infer<typeof acsServerSchema>;
