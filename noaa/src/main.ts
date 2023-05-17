import * as fs from 'fs';

import { TApiQueryParams, TDataResults, isNextTideData, isWaterLevelData } from './types';
import {
    TEndpoints,
    TOtherDataByTimestamp,
    namedResults,
    parseNextTideData,
    parseTypedJsonByEndpoint,
    parseWaterLevelData,
    prepareAllDataFetch,
} from './apiUtils';
import { initializeCamOverlay, updateCustomGraphicsText, updateInfoTickerText } from './coIntegration';

import { CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';
import { promisify } from 'util';

const setTimeoutPromise = promisify(setTimeout);

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

const coBasicSettings: CamOverlayOptions = {
    ip: settings.camera_ip === '' ? undefined : settings.camera_ip,
    port: settings.camera_port === '' ? undefined : settings.camera_port,
    auth:
        settings.camera_user === '' || settings.camera_pass === ''
            ? undefined
            : `${settings.camera_user}:${settings.camera_pass}`,
};

const main = async () => {
    const queryParams: TApiQueryParams = {
        ...defaultApiParams,
        stationId: settings.station_id,
    };

    if (Object.values(coBasicSettings).some((val) => val === undefined)) {
        return;
    }

    try {
        const dataToFetch = prepareAllDataFetch(queryParams);
        const resultsArray = (await Promise.all(Object.values(dataToFetch))).map((dataStr, index) =>
            parseTypedJsonByEndpoint(dataStr, (Object.keys(dataToFetch) as unknown as TEndpoints[])[index])
        ) as TDataResults;

        resultsArray.reduce((acc, curr, index) => {
            acc[Object.keys(namedResults)[index]] = curr;
            return acc;
        }, namedResults);

        const latestWaterLevelData = parseWaterLevelData(namedResults['waterLevel']);
        const latestTimestamp = Date.parse(latestWaterLevelData.data.t);

        const otherDataByTimestamp = {} as TOtherDataByTimestamp;
        for (const [endpoint, dataObj] of Object.entries(namedResults)) {
            if (isNextTideData(dataObj) || isWaterLevelData(dataObj)) {
                continue;
            }
            const dataArr: Array<typeof dataObj.data[number]> = dataObj.data;
            otherDataByTimestamp[endpoint as TEndpoints] = dataArr.find((d) => Date.parse(d.t) === latestTimestamp);
        }

        const textToDisplay = `${settings.location_name},${latestWaterLevelData.metadata.lat}N${
            latestWaterLevelData.metadata.lon
        }W,${latestWaterLevelData.data.t},Water level:${latestWaterLevelData.data.v} ft Above ${
            defaultApiParams.datum
        },${parseNextTideData(namedResults['nextTide'].predictions)},Water Temp:${
            otherDataByTimestamp['waterTemp'].v
        }F,Air Temp:${otherDataByTimestamp['airTemp'].v}F,Barometric Pressure:${
            otherDataByTimestamp['barometricPressure'].v
        } mb,Winds: ${otherDataByTimestamp['winds'].s} kts from ${otherDataByTimestamp['winds'].dr},Gusting to: ${
            otherDataByTimestamp['winds'].g
        } kts from ${otherDataByTimestamp['winds'].dr}`;

        initializeCamOverlay({
            ...coBasicSettings,
            serviceID: settings.it_service_id,
        });
        initializeCamOverlay({
            ...coBasicSettings,
            serviceID: settings.cg_service_id,
        });

        await Promise.all([
            updateInfoTickerText(settings.it_service_id, textToDisplay),
            updateCustomGraphicsText(settings.cg_service_id, textToDisplay, settings.cg_field_name),
        ]);

        await setTimeoutPromise(settings.data_refresh_rate_s * 1000);
    } catch (e) {
        console.error(e);
        process.exit();
    }
};

main();
