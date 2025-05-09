type TUnit = 'M' | 'I';

export const getTemperature = (temperature: string, unit: TUnit): number => {
    if (unit === 'I') {
        return (parseFloat(temperature) * 9) / 5 + 32;
    }
    return parseFloat(temperature);
};
