import { TWidget } from './models/schema';

export const coordOptionLabels: Record<TWidget['coAlignment'], string> = {
    top_left: 'Top Left',
    top_center: 'Top Center',
    top_right: 'Top Right',
    center_left: 'Center Left',
    center: 'Center',
    center_right: 'Center Right',
    bottom_left: 'Bottom Left',
    bottom_center: 'Bottom Center',
    bottom_right: 'Bottom Right',
};
export const COORD_LIST = Object.keys(coordOptionLabels) as TWidget['coAlignment'][];

export const parseValueAsInt = (value: string) => {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) {
        return value;
    } else {
        return parsedValue;
    }
};

export const parseValueAsFloat = (value: string) => {
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
        return value;
    } else {
        return parsedValue;
    }
};
