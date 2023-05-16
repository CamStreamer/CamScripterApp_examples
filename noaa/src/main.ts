import * as fs from 'fs';
import * as util from 'util';

import {
    TApiQueryParams,
    TDataResults,
    TOtherDataByTimestamps,
    TWaterAirTempBarPressureApiData,
    TWindsApiData,
    isNextTideData,
    isWaterLevelData,
} from './types';
import {
    TEndpoints,
    parseNextTideData,
    parseTypedJsonByEndpoint,
    parseWaterLevelData,
    prepareAllDataFetch,
} from './apiUtils';

// extract in case it will be dynamic in the future
const defaultApiParams: Omit<TApiQueryParams, 'stationId'> = {
    date: 'today',
    units: 'english',
    timeZone: 'lst',
    datum: 'MLLW',
};

let settings = null;
try {
    const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    settings = JSON.parse(data.toString());
} catch (err) {
    console.log('No settings file found');
    process.exit(1);
}

process.on('SIGINT', async () => {
    console.log('Configuration changed');
    process.exit();
});

process.on('SIGTERM', async () => {
    console.log('App exit');
    process.exit();
});

const main = async () => {
    const queryParams: TApiQueryParams = {
        ...defaultApiParams,
        stationId: settings.station_id,
    };

    try {
        const dataToFetch = prepareAllDataFetch(queryParams);
        const results = (await Promise.all(Object.values(dataToFetch))).map((dataStr, index) =>
            parseTypedJsonByEndpoint(
                dataStr,
                (Object.keys(dataToFetch) as unknown as Exclude<TEndpoints, 'waterLevel'>[])[index]
            )
        ) as TDataResults;

        const latestWaterLevelData = parseWaterLevelData(results[0]);
        const latestTimestamp = Date.parse(latestWaterLevelData.data.t);

        const otherDataByTimestamp = results
            .filter(
                (resObj): resObj is TWaterAirTempBarPressureApiData | TWindsApiData =>
                    !isNextTideData(resObj) && !isWaterLevelData(resObj)
            )
            .map((resObj) => {
                const dataArr: Array<typeof resObj.data[number]> = resObj.data;
                const data = dataArr.find((d) => Date.parse(d.t) === latestTimestamp);
                return data;
            }) as TOtherDataByTimestamps;

        const resultingString = `${settings.location_name},${latestWaterLevelData.metadata.lat}N${
            latestWaterLevelData.metadata.lon
        }W,${latestWaterLevelData.data.t},Water level:${latestWaterLevelData.data.v} ft Above ${
            defaultApiParams.datum
        },${parseNextTideData(results[1].predictions)},Water Temp:${otherDataByTimestamp[0].v}F,Air Temp:${
            otherDataByTimestamp[1].v
        }F,Barometric Pressure:${otherDataByTimestamp[2].v} mb,Winds: ${otherDataByTimestamp[3].s} kts from ${
            otherDataByTimestamp[3].dr
        },Gusting to: ${otherDataByTimestamp[3].g} kts from ${otherDataByTimestamp[3].dr}`;
    } catch (e) {
        console.error(e);
        process.exit();
    }
};

main();
