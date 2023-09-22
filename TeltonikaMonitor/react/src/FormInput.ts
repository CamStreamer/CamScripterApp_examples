type TAccuweatherApiValue = {
    fieldName: string;
    serviceIds: { id: number | '' }[];
};

export type FormInput = {
    modem: {
        token: string;
        device: string;
        refresh_period: number;
    };
    co_camera: {
        protocol: string;
        ip: string;
        port: number | null;
        user: string;
        password: string;
    };
    map_camera: {
        protocol: string;
        ip: string;
        port: number | null;
        user: string;
        password: string;
    };
    overlay: {
        x: number | null;
        y: number | null;
        alignment: string;
        width: number | null;
        height: number | null;
        scale: number | null;
    };
    map: {
        x: number | null;
        y: number | null;
        alignment: string;
        width: number | null;
        height: number | null;

        map_width: number | null;
        map_height: number | null;
        zoomLevel: number | null;
        APIkey: string;
        tolerance: number | null;
    };
    accuweather_camera: {
        protocol: string;
        ip: string;
        port: number | null;
        user: string;
        password: string;
    };
    accuweather: {
        APIkey: string;
        units: 'Metric' | 'Imperial';
        location: TAccuweatherApiValue;
        temperature: TAccuweatherApiValue;
        wind: TAccuweatherApiValue;
        wind_gust: TAccuweatherApiValue;
        humidity: TAccuweatherApiValue;
    };
};
export const defaultValues: FormInput = {
    modem: {
        token: '',
        device: '',
        refresh_period: 60,
    },
    co_camera: {
        protocol: 'http',
        ip: '127.0.0.1',
        port: 80,
        user: 'root',
        password: '',
    },
    map_camera: {
        protocol: 'http',
        ip: '127.0.0.1',
        port: 80,
        user: 'root',
        password: '',
    },
    overlay: {
        x: 10,
        y: 10,
        alignment: 'top_left',
        width: 1920,
        height: 1080,
        scale: 100,
    },
    map: {
        x: 10,
        y: 10,
        alignment: 'top_right',
        width: 1920,
        height: 1080,

        map_width: 100,
        map_height: 100,
        zoomLevel: 15,
        APIkey: '',
        tolerance: 2,
    },
    accuweather_camera: {
        protocol: 'http',
        ip: '127.0.0.1',
        port: 80,
        user: 'root',
        password: '',
    },
    accuweather: {
        APIkey: '',
        units: 'Metric',
        location: {
            fieldName: '',
            serviceIds: [
                {
                    id: '',
                },
            ],
        },
        temperature: {
            fieldName: '',
            serviceIds: [
                {
                    id: '',
                },
            ],
        },
        wind: {
            fieldName: '',
            serviceIds: [
                {
                    id: '',
                },
            ],
        },
        wind_gust: {
            fieldName: '',
            serviceIds: [
                {
                    id: '',
                },
            ],
        },
        humidity: {
            fieldName: '',
            serviceIds: [
                {
                    id: '',
                },
            ],
        },
    },
};

type keysOfUnion<T> = T extends T ? keyof T : never;

const numberValues = Object.values(defaultValues).reduce((prev, curr) => {
    prev.push(...Object.keys(curr).filter((key) => typeof curr[key as keyof typeof curr] == 'number'));
    return prev;
}, [] as string[]);

export function convertValueToNumber(input: FormInput) {
    (Object.keys(input) as (keyof FormInput)[]).forEach((key) => {
        const data = input[key] as Record<keysOfUnion<FormInput[keyof FormInput]>, string | number | null>;
        (Object.keys(data) as keysOfUnion<typeof data>[]).forEach((key) => {
            if (numberValues.includes(key)) {
                data[key] = Number(data[key]);
            }
        });
    });
}
