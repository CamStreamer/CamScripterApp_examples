import { z } from 'zod';

export const luxmeterSchema = z.object({
    frequency: z.number().positive(),
    low: z.number().nonnegative().default(0),
    high: z.number().nonnegative().default(Number.MAX_VALUE),
    period: z.number().nonnegative().default(0),
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
export const axisEventSchema = z.object({
    enabled: z.boolean(),
});
export const acsSchema = z.object({
    enabled: z.boolean(),
    protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    ip: z.union([z.string().ip(), z.literal('')]),
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

export const cameraServerSchema = z.object({
    tls: z.boolean(),
    tlsInsecure: z.boolean(),
    ip: z.string().ip(),
    port: z.number().positive().lt(65535),
    user: z.string(),
    pass: z.string(),
});
export const acsServerSchema = z.object({
    enabled: z.boolean(),
    tls: z.boolean(),
    tlsInsecure: z.boolean(),
    ip: z.string().ip(),
    port: z.number().positive().lt(65535),
    user: z.string(),
    pass: z.string(),
    source_key: z.string(),
});
export const serverConvertedData = z.object({
    luxmeter: luxmeterSchema,
    cameras: cameraServerSchema.array(),
    widget: widgetSchema,
    events: axisEventSchema,
    acs: acsServerSchema,
});

export type TCameraServer = z.infer<typeof cameraServerSchema>;
export type TAcsServer = z.infer<typeof acsServerSchema>;
export type TServerConvertedData = z.infer<typeof serverConvertedData>;
