export const parseValueAsInt = (value: string) => {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) {
        return value;
    } else {
        return parsedValue;
    }
};

export const parseScaledValue = (value: string, numDecimals: number) => {
    const parsedIntValue = parseValueAsInt(value);
    if (typeof parsedIntValue === 'string') {
        return parsedIntValue;
    } else {
        return parseFloat((parsedIntValue / 100).toFixed(numDecimals));
    }
};

export const parseScaledDisplayValue = (value: string | number, scaleFactor: number) => {
    if (typeof value === 'string') {
        return value;
    } else {
        return Math.floor(value * scaleFactor);
    }
};
