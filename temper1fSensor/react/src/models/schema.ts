import { z } from 'zod';

export const applicationSchema = z.object({
  camera_protocol: z.union([
    z.literal('http'),
    z.literal('https'),
    z.literal('https_insecure'),
  ]),
  camera_ip: z.string(),
  camera_port: z.number(),
  camera_user: z.string(),
  camera_pass: z.string(),
  unit: z.union([z.literal('c'), z.literal('f')]),
  service_id: z.number(),
  field_name: z.string(),
  acs_protocol: z.union([
    z.literal('http'),
    z.literal('https'),
    z.literal('https_insecure'),
  ]),
  acs_ip: z.string(),
  acs_port: z.number(),
  acs_user: z.string(),
  acs_pass: z.string(),
  acs_source_key: z.string(),
  acs_condition_delay: z.number(),
  acs_condition_operator: z.number(),
  acs_condition_value: z.number(),
  acs_repeat_after: z.number(),
  event_camera_protocol: z.union([
    z.literal('http'),
    z.literal('https'),
    z.literal('https_insecure'),
  ]),
  event_camera_ip: z.string(),
  event_camera_port: z.number(),
  event_camera_user: z.string(),
  event_camera_pass: z.string(),
  event_condition_delay: z.number().int(),
  event_condition_operator: z.number().int().min(0).max(4),
  event_condition_value: z.number(),

  event_view_areas: z.array(
    z.object({
      value: z.number(),
      label: z.string(),
    })
  ),
  event_active: z.boolean(),
  event_repeat_after: z.number(),
  view_areas: z.array(
    z.object({
      value: z.number(),
      label: z.string(),
    })
  ),
  acs_active: z.boolean(),
});

export type TAppSchema = z.infer<typeof applicationSchema>;
