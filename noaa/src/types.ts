export type TApiQueryParams = {
    stationId: number;
    date: 'today';
    units: 'english';
    timeZone: 'lst';
    datum: 'MLLW';
};

export type TApiResponseMetadata = {
    id: string;
    name: string;
    lat: string;
    lon: string;
};

export type TWaterLevelApiData = {
    metadata: TApiResponseMetadata;
    data: {
        t: string;
        v: string;
        s: string;
        f: string;
        q: string;
    }[];
};

export type TNextTideApiData = {
    predictions: {
        t: string;
        v: string;
        type: 'L' | 'H';
    }[];
};

export type TWaterAirTempBarPressureApiData = {
    metadata: TApiResponseMetadata;
    data: {
        t: string;
        v: string;
        f: string;
    }[];
};

export type TWindsApiData = {
    metadata: TApiResponseMetadata;
    data: {
        t: string;
        s: string;
        d: string;
        dr: string;
        g: string;
        f: string;
    }[];
};

export const isNextTideData = (
    obj: TNextTideApiData | TWaterAirTempBarPressureApiData | TWindsApiData
): obj is TNextTideApiData => (obj as TNextTideApiData).predictions !== undefined;

export const isWaterLevelData = (
    obj: TNextTideApiData | TWaterAirTempBarPressureApiData | TWindsApiData
): obj is TWaterLevelApiData => (obj as TWaterLevelApiData).data[0].q !== undefined;

export type TDataResults = [
    TWaterLevelApiData,
    TNextTideApiData,
    TWaterAirTempBarPressureApiData,
    TWaterAirTempBarPressureApiData,
    TWaterAirTempBarPressureApiData,
    TWindsApiData
];

export type TOtherDataByTimestamps = [
    TWaterAirTempBarPressureApiData['data'][number],
    TWaterAirTempBarPressureApiData['data'][number],
    TWaterAirTempBarPressureApiData['data'][number],
    TWindsApiData['data'][number]
];
