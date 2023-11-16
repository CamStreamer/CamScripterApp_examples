import { z } from 'zod';

const cameraSchema = z.object({
    protocol: z.string(),
    ip: z.string().ip(),
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
    scale: z.number(),
});

const storageSchema = z.object({
    url: z.string().url(),
    outputDir: z.string(),
    clientSecret: z.string(),
    clientId: z.string(),
    tenantId: z.string(),
    connectionTimeoutS: z.number().nonnegative(),
    uploadTimeoutS: z.number().nonnegative(),
    numberOfRetries: z.number().nonnegative(),
});

const ledSchema = z.object({
    greenPort: z.number().nonnegative(),
    redPort: z.number().nonnegative(),
});

const barcodeSettingsSchema = z.object({
    displayTimeS: z.number().nonnegative(),
});

export const formSchema = cameraSchema
    .merge(overlaySchema)
    .merge(storageSchema)
    .merge(ledSchema)
    .merge(barcodeSettingsSchema);

export type TFormValues = z.infer<typeof formSchema>;
