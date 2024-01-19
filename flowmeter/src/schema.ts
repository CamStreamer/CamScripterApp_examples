import { z } from 'zod';

export const settingsSchema = z.object({
    started: z.boolean(),
    camera_ip: z.string().min(1),
    camera_port: z.number().positive(),
    camera_user: z.string().min(1),
    camera_pass: z.string().min(1),
    coord: z.string(),
    pos_x: z.number(),
    pos_y: z.number(),
    res_w: z.number().positive(),
    res_h: z.number().positive(),
    group_name: z.string(),
    start_time: z.string(),
    scale: z.number().positive(),
});
export type TSettingsSchema = z.infer<typeof settingsSchema>;
