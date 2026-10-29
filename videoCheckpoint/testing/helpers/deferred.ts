export const createDeferred = <T = void>() => {
    let resolve: (value: T) => void = () => undefined;
    const promise = new Promise<T>((res) => (resolve = res));
    return { promise, resolve };
};

export const waitUntil = async (condition: () => boolean, timeoutMs = 5000, what = 'condition') => {
    const deadline = Date.now() + timeoutMs;
    while (!condition()) {
        if (Date.now() > deadline) {
            throw new Error(`Timed out waiting for ${what}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
