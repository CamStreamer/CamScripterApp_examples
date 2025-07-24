import { z } from 'zod';

export const settingsSchema = z.object({
    started: z.boolean(),
    camera_protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    camera_ip: z.string(),
    camera_port: z.number(),
    camera_user: z.string(),
    camera_pass: z.string(),
    coord: z.string(),
    pos_x: z.number(),
    pos_y: z.number(),
    resolution: z.string(),
    camera_list: z.array(z.number()),
    group_name: z.string(),
    start_time: z.string(),
    scale: z.number(),
    calibration_volume: z.number(),
    overlay_type: z.union([z.literal('axis_beer'), z.literal('beer'), z.literal('birel')]),
});

export type TSettings = z.infer<typeof settingsSchema>;
