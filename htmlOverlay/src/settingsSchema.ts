import { z } from 'zod';

export const settingsSchema = z.array(
    z.object({
        enabled: z.boolean(),
        configName: z.string(),
        imageSettings: z.object({
            url: z.union([z.string().url(), z.literal('')]),
            renderWidth: z.number().nonnegative(),
            renderHeight: z.number().nonnegative(),
            refreshRate: z.number().nonnegative(),
        }),
        cameraSettings: z.object({
            protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
            ip: z.union([z.string().ip(), z.literal('')]),
            port: z.number().positive().lt(65535),
            user: z.string(),
            pass: z.string(),
        }),
        coSettings: z.object({
            cameraList: z.array(z.number()).nullable(),
            coordSystem: z.union([
                z.literal('top_left'),
                z.literal('top_right'),
                z.literal('bottom_left'),
                z.literal('bottom_right'),
            ]),
            posX: z.number(),
            posY: z.number(),
            streamWidth: z.number().nonnegative(),
            streamHeight: z.number().nonnegative(),
        }),
    })
);

export type TSettings = z.infer<typeof settingsSchema>;
