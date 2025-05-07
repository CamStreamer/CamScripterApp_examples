import { z } from 'zod';

export const connectionParamsSchema = z.object({
    protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    ip: z.union([z.string().ip(), z.literal('')]),
    port: z.number().positive().lt(65535),
    user: z.string(),
    pass: z.string(),
});
export type TConnectionParams = z.infer<typeof connectionParamsSchema>;

export const serverDataSchema = z.object({
    source_camera: connectionParamsSchema,
    output_camera: connectionParamsSchema,
    widget: z.object({
        coord_system: z.union([
            z.literal('top_left'),
            z.literal('top_right'),
            z.literal('bottom_left'),
            z.literal('bottom_right'),
        ]),
        pos_x: z.number().nonnegative(),
        pos_y: z.number().nonnegative(),
        stream_resolution: z.string(),
        camera_list: z.number().array().nonempty(),
        scale: z.number().positive(),
        units: z.union([z.literal('M'), z.literal('I')]),
    }),
});
export type TServerData = z.infer<typeof serverDataSchema>;
