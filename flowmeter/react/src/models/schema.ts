import { z } from 'zod';

export const settingsSchema = z.object({
    started: z.boolean(),
    camera_ip: z.string(),
    camera_port: z.number(),
    camera_user: z.string(),
    camera_pass: z.string(),
    coord: z.string(),
    pos_x: z.number(),
    pos_y: z.number(),
    resolution: z.string(),
    group_name: z.string(),
    start_time: z.string(),
    scale: z.number(),
});

export type TSettings = z.infer<typeof settingsSchema>;
