import { z } from 'zod';

export const settingsSchema = z.object({
    camera_ip: z.string(),
    camera_port: z.number(),
    camera_user: z.string(),
    camera_pass: z.string(),
    rss_url: z.string(),
    channel_name: z.string(),
    content_type: z.union([z.literal('title'), z.literal('description')]),
    output_type: z.union([z.literal('infoticker'), z.literal('custom_graphics')]),
    service_id: z.number(),
    cg_field_name: z.string(),
    update_interval: z.number(),
});

export type TSettings = z.infer<typeof settingsSchema>;
