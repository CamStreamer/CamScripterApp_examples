import { TAppSchema } from '../models/schema';

export const PROTOCOL_LABELS: Record<TAppSchema['camera_protocol'], string> = {
    http: 'HTTP',
    https: 'HTTPS',
    https_insecure: 'HTTPS (not trusted cert)',
};

export const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as TAppSchema['camera_protocol'][];

export const EVENT_DELAYS_LABELS: Record<string, string> = {
    0: 'Immediately',
    120: 'After 2 minutes',
    300: 'After 5 minutes',
    600: 'After 10 minutes',
    1800: 'After 30 minutes',
    3600: 'After 1 hour',
    10800: 'After 3 hours',
    21600: 'After 6 hours',
    43200: 'After 12 hours',
    86400: 'After 1 day',
};

export const EVENT_DELAYS = Object.keys(EVENT_DELAYS_LABELS).map(Number);

export const WHEN_LABELS: Record<TAppSchema['event_condition_operator'], string> = {
    0: 'Equal',
    1: 'Higher than',
    2: 'Lower than',
    3: 'Higher or equal',
    4: 'Lower or equal',
};

export const WHEN = Object.keys(WHEN_LABELS).map(Number) as Array<keyof typeof WHEN_LABELS>;
