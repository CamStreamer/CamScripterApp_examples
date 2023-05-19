import * as fs from 'fs';

import { TApiQueryParams, TDataResults, TSettings, isNextTideData, isWaterLevelData } from './types';
import {
    TEndpoints,
    TOtherDataByTimestamp,
    namedResults,
    parseNextTideData,
    parseTypedJsonByEndpoint,
    parseWaterLevelData,
    prepareAllDataFetch,
} from './apiUtils';

import { CamOverlayIntegration } from './CamOverlayIntegration';
import { CamOverlayOptions } from 'camstreamerlib/CamOverlayAPI';
import { NetworkError } from './errors';
import { promisify } from 'util';

const setTimeoutPromise = promisify(setTimeout);

// extract in case it will be dynamic in the future
const defaultApiParams: Omit<TApiQueryParams, 'stationId'> = {
    date: 'today',
    units: 'english',
    timeZone: 'lst',
    datum: 'MLLW',
};

let settings: TSettings;
try {
    const data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    settings = JSON.parse(data.toString());
} catch (err) {
    console.log('No settings file found');
    process.exit(1);
}

const coBasicSettings: CamOverlayOptions = {
    ip: settings.camera_ip,
    port: settings.camera_port,
    auth:
        settings.camera_user === '' || settings.camera_pass === ''
            ? ''
            : `${settings.camera_user}:${settings.camera_pass}`,
};

if (Object.values(coBasicSettings).some((val) => val === '')) {
    console.log('CamOverlay service was not set.');
    process.exit();
}

const camOverlayApiIntegration = new CamOverlayIntegration(coBasicSettings);

camOverlayApiIntegration.initializeInfoTickerCamOverlayApi(settings.it_service_id);
camOverlayApiIntegration.initializeCustomGraphicsCamOverlayApi(settings.cg_service_id);

const main = async () => {
    const queryParams: TApiQueryParams = {
        ...defaultApiParams,
        stationId: settings.station_id,
    };

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
        }\xB0F,Air Temp:${otherDataByTimestamp['airTemp'].v}\xB0F,Barometric Pressure:${
            otherDataByTimestamp['barometricPressure'].v
        } mb,Winds: ${otherDataByTimestamp['winds'].s} kts from ${otherDataByTimestamp['winds'].dr},Gusting to: ${
            otherDataByTimestamp['winds'].g
        } kts from ${otherDataByTimestamp['winds'].dr}`;

        await Promise.all([
            camOverlayApiIntegration.updateInfoTickerText(settings.it_service_id, textToDisplay),
            camOverlayApiIntegration.updateCustomGraphicsText(
                settings.cg_service_id,
                textToDisplay,
                settings.cg_field_name
            ),
        ]);

        await setTimeoutPromise(settings.data_refresh_rate_s * 1000);
    } catch (e: unknown) {
        console.error('error', e);
        if (e instanceof NetworkError) {
            process.exit();
        }
        await setTimeoutPromise(settings.data_refresh_rate_s * 1000);
    }
};

main();
