export type TUnit = 'C' | 'F';

export type TColor = [number, number, number];

export type TData = {
    'PM1.0': number;
    'PM2.5': number;
    'PM4.0': number;
    'PM10.0': number;
    'Temperature': number;
    'Humidity': number;
    'VOC': number;
    'NOx': number;
    'CO2': number;
    'AQI': number;
    'Vaping': number;
};

export type TInfo = {
    value: number;
    severity: keyof typeof SEVERITY | 'undetected' | 'detected';
};

export const DEFAULT_DATA: Record<keyof TData, TInfo> = {
    'PM1.0': {
        value: 0,
        severity: 'good',
    },
    'PM2.5': {
        value: 0,
        severity: 'good',
    },
    'PM4.0': {
        value: 0,
        severity: 'good',
    },
    'PM10.0': {
        value: 0,
        severity: 'good',
    },
    'Temperature': {
        value: 0,
        severity: 'good',
    },
    'Humidity': {
        value: 0,
        severity: 'good',
    },
    'VOC': {
        value: 0,
        severity: 'good',
    },
    'NOx': {
        value: 0,
        severity: 'good',
    },
    'CO2': {
        value: 0,
        severity: 'good',
    },
    'AQI': {
        value: 0,
        severity: 'good',
    },
    'Vaping': {
        value: 0,
        severity: 'undetected',
    },
};

export const QUALITY_TIERS: Record<keyof TData, Record<string, [number, number]>> = {
    'PM1.0': {},
    'PM2.5': {
        good: [0, 9],
        moderate: [9.1, 35.4],
        sensitive: [35.5, 55.4],
        unhealthy: [55.5, 125.4],
        very_unhealthy: [125.5, 225.4],
        hazardous: [225.5, 500],
    },
    'PM4.0': {},
    'PM10.0': {
        good: [0, 54],
        moderate: [55, 154],
        sensitive: [155, 254],
        unhealthy: [255, 354],
        very_unhealthy: [355, 424],
        hazardous: [425, 1000],
    },
    'Temperature': {},
    'Humidity': {},
    'VOC': {
        good: [0, 100],
        moderate: [101, 300],
        sensitive: [301, 400],
        unhealthy: [401, 500],
    },
    'NOx': {
        good: [0, 30],
        moderate: [31, 150],
        sensitive: [151, 300],
        unhealthy: [301, 500],
    },
    'CO2': {
        good: [0, 1000],
        sensitive: [1001, 2000],
        unhealthy: [2001, 5000],
        very_unhealthy: [5001, 40000],
    },
    'AQI': {
        good: [0, 50],
        moderate: [51, 100],
        sensitive: [101, 150],
        unhealthy: [151, 200],
        very_unhealthy: [201, 300],
        hazardous: [301, 500],
    },
    'Vaping': {},
};

export const SEVERITY = {
    good: [0, 153 / 255, 76 / 255],
    moderate: [1.0, 1.0, 51 / 255],
    sensitive: [1.0, 128 / 255, 0],
    unhealthy: [1.0, 51 / 255, 51 / 255],
    very_unhealthy: [102 / 255, 0, 204 / 255],
    hazardous: [153 / 255, 0, 0],
    error: [0, 0, 0],
};
