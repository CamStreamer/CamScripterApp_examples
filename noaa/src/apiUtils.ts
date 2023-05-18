import * as https from 'https';

import {
    TApiQueryParams,
    TNextTideApiData,
    TWaterAirTempBarPressureApiData,
    TWaterLevelApiData,
    TWindsApiData,
} from './types';

import { NetworkError } from './errors';

const API_PATH = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

const API_ENDPOINTS = {
    waterLevel: (queryParams: TApiQueryParams) =>
        `${API_PATH}?date=${queryParams.date}&station=${queryParams.stationId}&format=json&units=${queryParams.units}&time_zone=${queryParams.timeZone}&datum=${queryParams.datum}&product=water_level`,
    nextTide: (queryParams: TApiQueryParams) =>
        `${API_PATH}?date=${queryParams.date}&station=${queryParams.stationId}&format=json&units=${queryParams.units}&time_zone=${queryParams.timeZone}&datum=${queryParams.datum}&product=predictions&interval=hilo`,
    waterTemp: (queryParams: TApiQueryParams) =>
        `${API_PATH}?date=${queryParams.date}&station=${queryParams.stationId}&format=json&units=${queryParams.units}&time_zone=${queryParams.timeZone}&datum=${queryParams.datum}&product=water_temperature`,
    airTemp: (queryParams: TApiQueryParams) =>
        `${API_PATH}?date=${queryParams.date}&station=${queryParams.stationId}&format=json&units=${queryParams.units}&time_zone=${queryParams.timeZone}&datum=${queryParams.datum}&product=air_temperature`,
    barometricPressure: (queryParams: TApiQueryParams) =>
        `${API_PATH}?date=${queryParams.date}&station=${queryParams.stationId}&format=json&units=${queryParams.units}&time_zone=${queryParams.timeZone}&datum=${queryParams.datum}&product=air_pressure`,
    winds: (queryParams: TApiQueryParams) =>
        `${API_PATH}?date=${queryParams.date}&station=${queryParams.stationId}&format=json&units=${queryParams.units}&time_zone=${queryParams.timeZone}&datum=${queryParams.datum}&product=wind`,
} as const;

export type TEndpoints = keyof typeof API_ENDPOINTS;
type TDataPromises = Record<TEndpoints, Promise<string>>;

export type TParsedDataType<T> = T extends 'waterLevel'
    ? TWaterLevelApiData
    : T extends 'nextTide'
    ? TNextTideApiData
    : T extends 'winds'
    ? TWindsApiData
    : TWaterAirTempBarPressureApiData;

export type TNamedDataResults = {
    waterLevel: TWaterLevelApiData | null;
    nextTide: TNextTideApiData | null;
    waterTemp: TWaterAirTempBarPressureApiData | null;
    airTemp: TWaterAirTempBarPressureApiData | null;
    barometricPressure: TWaterAirTempBarPressureApiData | null;
    winds: TWindsApiData | null;
};

export type TOtherDataByTimestamp = {
    waterTemp: TWaterAirTempBarPressureApiData['data'][number];
    airTemp: TWaterAirTempBarPressureApiData['data'][number];
    barometricPressure: TWaterAirTempBarPressureApiData['data'][number];
    winds: TWindsApiData['data'][number];
};

export const namedResults: TNamedDataResults = {
    waterLevel: null,
    nextTide: null,
    waterTemp: null,
    airTemp: null,
    barometricPressure: null,
    winds: null,
};

export const parseTypedJsonByEndpoint = <T extends TEndpoints>(jsonString: string, endpoint: T) =>
    JSON.parse(jsonString) as TParsedDataType<T>;

export const parseWaterLevelData = (data: TWaterLevelApiData) => {
    const latestData = data.data.reduce((acc, curr) => {
        const timestamp = Date.parse(curr.t);
        if (Date.parse(acc.t) < timestamp) {
            return curr;
        } else return acc;
    }, data.data[0]);
    return { metadata: data.metadata, data: latestData };
};

export const prepareAllDataFetch = (queryParams: TApiQueryParams): TDataPromises =>
    (Object.keys(namedResults) as unknown as TEndpoints[]).reduce((obj, endpoint) => {
        obj[endpoint] = fetchApiData(endpoint, queryParams);
        return obj;
    }, {} as TDataPromises);

export const parseNextTideData = (predictions: TNextTideApiData['predictions']) =>
    predictions.reduce((acc, curr) => {
        const timeString = new Date(curr.t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const position = curr.type === 'H' ? 'high' : 'low';
        acc += `${timeString} ${position} ${curr.v}`;
        return acc;
    }, '');

const fetchApiData = async (urlEndpoint: keyof typeof API_ENDPOINTS, queryParams: TApiQueryParams) => {
    return new Promise<string>((resolve, reject) => {
        https
            .get(API_ENDPOINTS[urlEndpoint](queryParams), (res) => {
                let data = [];
                res.on('data', (chunk) => {
                    data.push(chunk);
                });
                res.on('end', () => {
                    const response = Buffer.concat(data).toString();
                    if (!(res.statusCode >= 200 && res.statusCode < 300)) {
                        reject(
                            `API returned with error. Status: ${res.statusCode}, ${res.statusMessage}. Response from server: ${response}`
                        );
                    } else {
                        resolve(response);
                    }
                });
            })
            .on('error', (e) => {
                reject(new NetworkError(`NETWORK ERROR: ${e}`));
            });
    });
};
