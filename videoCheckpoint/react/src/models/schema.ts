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
    barcode_validation_rule: z.string(),
    conn_hub: connectionParamsSchema,
    camera: connectionParamsSchema.merge(
        z.object({
            serial_number: z.string(),
        })
    ),
    output_camera: connectionParamsSchema,
    image_upload: z.object({
        camera_list: z.number().array().nonempty(),
        resolution: z.string(),
    }),
    video_upload: z.object({
        prebuffer_sec: z.number().nonnegative(),
        postbuffer_sec: z.number().nonnegative(),
        timeout_enabled: z.boolean(),
        timeout_sec: z.number().positive(),
        closing_barcode_enabled: z.boolean(),
        closing_barcode: z.string(), // In UI called "specific barcode", soon "stop barcode"
        starting_barcode_enabled: z.boolean(),
        starting_barcode: z.string(),
        camera_list: z.number().array().nonempty(),
    }),
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
        visibility_time_sec: z.number().positive(),
    }),
    axis_events: z
        .object({
            conn_hub: z.boolean(),
            camera: z.boolean(),
        })
        .optional(),
    acs: connectionParamsSchema.merge(
        z.object({
            enabled: z.boolean(),
            source_key: z.string(),
        })
    ),
    genetec: connectionParamsSchema.merge(
        z.object({
            enabled: z.boolean(),
            base_uri: z.string(),
            app_id: z.string(),
            app_id_enabled: z.boolean(),
            camera_list: z.string().array(),
        })
    ),
    milestone: z.object({
        enabled: z.boolean(),
        transaction_source: z.string(),
        port: z.number().positive().lt(65535),
    }),
    google_drive: z.object({
        enabled: z.boolean(),
        type: z.string(),
        email: z.union([z.string().email(), z.literal('')]),
        private_key: z.string(),
        folder_id: z.string(),
    }),
    ftp_server: connectionParamsSchema.merge(
        z.object({
            type: z.string(),
            protocol: z.literal('ftp'),
            enabled: z.boolean(),
            upload_path: z.string(),
        })
    ),
    share_point: z.object({
        enabled: z.boolean(),
        url: z.union([z.string().url(), z.literal('')]),
        output_dir: z.string(),
        client_secret: z.string(),
        client_id: z.string(),
        tenant_id: z.string(),
        connection_timeout_s: z.number().nonnegative(),
        upload_timeout_s: z.number().nonnegative(),
        number_of_retries: z.number().nonnegative(),
    }),
    led: z.object({
        enabled: z.boolean(),
        led_green_port: z.number().nonnegative().lt(100),
        led_red_port: z.number().nonnegative().lt(100),
    }),
});
export type TServerData = z.infer<typeof serverDataSchema>;
