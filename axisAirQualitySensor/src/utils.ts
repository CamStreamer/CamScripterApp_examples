import { TUnit, TData, QUALITY_TIERS, SEVERITY } from './constants';

export const getTemperature = (temperature: string, unit: TUnit): string => {
    if (unit === 'F') {
        return ((parseFloat(temperature) * 9) / 5 + 32).toFixed(1);
    }
    return parseFloat(temperature).toFixed(1);
};

// returns key of the severity
export const getSeverity = (param: keyof TData, value: number): keyof typeof SEVERITY => {
    if (param === 'Vaping') {
        return value > 0 ? 'unhealthy' : 'good';
    }

    const tiers = QUALITY_TIERS[param];
    const tierKeys = Object.keys(tiers);

    if (tierKeys.length === 0) {
        return 'good';
    }

    for (const tier of tierKeys) {
        const [lowest, highest] = tiers[tier];
        if (value >= lowest && value <= highest) {
            return tier as keyof typeof SEVERITY;
        }
    }

    return 'error';
};
