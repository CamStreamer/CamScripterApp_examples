import { TConnectionParams } from '../models/schema';

export const PROTOCOL_LABELS: Record<TConnectionParams['protocol'], string> = {
    http: 'HTTP',
    https: 'HTTPS',
    https_insecure: 'HTTPS (not trusted cert)',
};

export const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as TConnectionParams['protocol'][];

export const PORT_LABELS: Record<string, string> = {
    1: 'A',
    2: 'B',
};
export const PORT = Object.keys(PORT_LABELS);
