export function pad(num: number, size: number) {
    const sign = Math.sign(num) === -1 ? '-' : '';
    return (
        sign +
        new Array(size)
            .concat([Math.abs(num)])
            .join('0')
            .slice(-size)
    );
}

export function isConditionActive(weight: number, operator: number, conditionValue: number) {
    switch (operator) {
        case 0:
            return weight === conditionValue;
        case 1:
            return weight > conditionValue;
        case 2:
            return weight < conditionValue;
        case 3:
            return weight >= conditionValue;
        case 4:
            return weight <= conditionValue;
        default:
            return false;
    }
}
