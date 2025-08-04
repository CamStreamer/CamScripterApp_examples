import { TSettings } from './models/schema';

export const COORD_LIST_LABELS: Record<TSettings['coord'], string> = {
    top_left: 'Top Left',
    top_right: 'Top Right',
    bottom_left: 'Bottom Left',
    bottom_right: 'Bottom Right',
};
export const COORD_LIST = Object.keys(COORD_LIST_LABELS) as TSettings['coord'][];

export const PROTOCOL_LABELS: Record<TSettings['camera_protocol'], string> = {
    http: 'HTTP',
    https: 'HTTPS',
    https_insecure: 'HTTPS (not trusted cert)',
};

export const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as TSettings['camera_protocol'][];

export const OVERLAY_TYPES_LABELS: Record<TSettings['overlay_type'], string> = {
    axis_beer: 'Beer with Axis logo',
    beer: 'Beer',
    birel: 'Non-alcoholic beer',
};

export const OVERLAY_TYPES = Object.keys(OVERLAY_TYPES_LABELS) as Array<keyof typeof OVERLAY_TYPES_LABELS>;
