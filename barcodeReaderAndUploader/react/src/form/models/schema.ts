import { z } from 'zod';

const cameraSchema = z.object({
    protocol: z.union([z.literal('http'), z.literal('https'), z.literal('https_insecure')]),
    ip: z.union([z.string().ip(), z.literal('')]),
    port: z.number().nonnegative(),
    user: z.string(),
    pass: z.string(),
});

const alignmentSchema = z.union([
    z.literal('top_left'),
    z.literal('top'),
    z.literal('top_right'),
    z.literal('left'),
    z.literal('center'),
    z.literal('right'),
    z.literal('bottom_left'),
    z.literal('bottom'),
    z.literal('bottom_right'),
]);

const overlaySchema = z.object({
    x: z.number(),
    y: z.number(),
    alignment: alignmentSchema,
    width: z.number().nonnegative(),
    height: z.number().nonnegative(),
    scale: z.number().nonnegative(),
});

const storageSchema = z.object({
    url: z.union([z.string().url(), z.literal('')]),
    outputDir: z.string(),
    clientSecret: z.string(),
    clientId: z.string(),
    tenantId: z.string(),
    connectionTimeoutS: z.number().nonnegative().optional(),
    uploadTimeoutS: z.number().nonnegative().optional(),
    numberOfRetries: z.number().nonnegative().optional(),
});

const ledSettingsSchema = z.object({
    greenPort: z.number().nonnegative(),
    redPort: z.number().nonnegative(),
});

const barcodeSettingsSchema = z.object({
    displayTimeS: z.number().nonnegative(),
});

export const formSchema = cameraSchema
    .merge(overlaySchema)
    .merge(storageSchema)
    .merge(ledSettingsSchema)
    .merge(barcodeSettingsSchema);

export type TFormValues = z.infer<typeof formSchema>;

export const serverDataSchema = z.object({
    camera: cameraSchema,
    overlay: overlaySchema,
    storage: storageSchema,
    leddSettings: ledSettingsSchema,
    barcodeSettings: barcodeSettingsSchema,
});

export type TServerData = z.infer<typeof serverDataSchema>;
