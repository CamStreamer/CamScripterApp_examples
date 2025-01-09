import { TConnectionParams, TServerData } from '../../models/schema';

export const PROTOCOL_LABELS: Record<TConnectionParams['protocol'], string> = {
    http: 'HTTP',
    https: 'HTTPS',
    https_insecure: 'HTTPS (not trusted cert)',
};

export const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as TConnectionParams['protocol'][];

export const SOURCES_LABELS: Record<string, string> = {
    http: 'HTTP request',
    serial: 'Serial port',
    usb: 'USB port',
    ocr: 'OCR',
    ftp: 'FTP on camera',
};

export const SOURCES = Object.keys(SOURCES_LABELS) as Array<keyof typeof SOURCES_LABELS>;

export const COORD_LIST_LABELS: Record<TServerData['widget']['coord_system'], string> = {
    top_left: 'Top Left',
    top_right: 'Top Right',
    bottom_left: 'Bottom Left',
    bottom_right: 'Bottom Right',
};
export const COORD_LIST = Object.keys(COORD_LIST_LABELS) as TServerData['widget']['coord_system'][];

export const OUTPUT_TYPES_LABELS: Record<string, string> = {
    image: 'Image',
    video: 'Video',
};

export const OUTPUT_TYPES = Object.keys(OUTPUT_TYPES_LABELS) as Array<keyof typeof OUTPUT_TYPES_LABELS>;
