import * as http from 'http';

const getAccuweatherPositionAPi = (apiKey: string, lat: number, lon: number) =>
    `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${apiKey}&q=${lat},${lon}`;

const getAccuweatherTemperatureAPi = (apiKey: string, position: number) =>
    `http://dataservice.accuweather.com/currentconditions/v1/${position}?apikey=${apiKey}&details=true`;

const fetchApiData = async (url: string) => {
    return new Promise<string>((resolve, reject) => {
        http.get(url, (res) => {
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            const data: any[] = [];
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
        }).on('error', (e) => {
            reject(new NetworkError(`NETWORK ERROR: ${e}`));
        });
    });
};

export type TUnit = 'Metric' | 'Imperial';

export const getApiData = async (apiKey: string, lat: number, lon: number, unit: TUnit) => {
    const positionResponse = await fetchApiData(getAccuweatherPositionAPi(apiKey, lat, lon));
    const { Key: locationID, EnglishName } = JSON.parse(positionResponse);
    const temperatureResponse = await fetchApiData(getAccuweatherTemperatureAPi(apiKey, locationID));
    const { Temperature, Wind, WindGust, RelativeHumidity } = JSON.parse(temperatureResponse)[0];
    return {
        location: `Location: ${EnglishName}`,
        temperature: `Temperature: ${Temperature[unit].Value}\xB0${Temperature[unit].Unit}`,
        wind: `Wind: ${Wind.Speed[unit].Value}${Wind.Speed[unit].Unit}`,
        wind_gust: `Wind gust: ${WindGust.Speed[unit].Value}${WindGust.Speed[unit].Unit}`,
        humidity: `Humidity: ${RelativeHumidity}`,
    };
};

class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Network error';
    }
}

export const parseSettingsData = (settings: { fieldName: string; serviceIds: { id: number | '' }[] }, text: string) => {
    const servicesToSendTo = settings.serviceIds.map((obj) => obj.id).filter((id) => id !== '') as number[];
    if (settings.fieldName === '') {
        return null;
    }
    return {
        text,
        serviceIds: servicesToSendTo,
        fieldName: settings.fieldName,
    };
};
