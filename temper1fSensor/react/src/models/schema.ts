import { z } from "zod";

const connectionParams = {
  protocol: z.union([
    z.literal("http"),
    z.literal("https"),
    z.literal("https_insecure"),
  ]),
  ip: z.string(),
  port: z.number(),
  user: z.string(),
  pass: z.string(),
};
export const cameraSchema = z.object({
  ...connectionParams,
  serviceID: z.number(),
  fieldName: z.string(),
});
export const applicationSchema = z.object({
  protocol: z.union([
    z.literal("http"),
    z.literal("https"),
    z.literal("https_insecure"),
  ]),
  ip: z.string(),
  port: z.number(),
  portID: z.string(),
  updateFrequency: z.number(),
});
export const settingsSchema = z.object({
  camera: cameraSchema,
  application: applicationSchema,
});

export type TCamera = z.infer<typeof cameraSchema>;
export type TPapago = z.infer<typeof applicationSchema>;
export type TSettings = z.infer<typeof settingsSchema>;
