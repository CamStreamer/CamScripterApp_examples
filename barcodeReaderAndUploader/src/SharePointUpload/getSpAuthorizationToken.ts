import * as urlLib from 'url';
import { settings } from '../settings';
import fetch from 'node-fetch';

// based on node-sp-auth package, OnlineAddinOnly.js
// we cant use it cause got lib uses function generator

let tokenCache = {
    key: '',
    token: '',
};

const SharePointServicePrincipal = '00000003-0000-0ff1-ce00-000000000000';

export const getSpAuthorizationToken = async () => {
    const url = settings.storage.url;
    const tenantId = settings.storage.tenantId;
    const sharepointhostname = urlLib.parse(url).hostname;
    const cacheKey = `${sharepointhostname}@${settings.storage.clientSecret}@${settings.storage.clientId}`;

    if (tokenCache.key === cacheKey) {
        return tokenCache.token;
    }

    const authUrl = await getAuthUrl(url);

    const resource = `${SharePointServicePrincipal}/${sharepointhostname}@${tenantId}`;
    const fullClientId = `${settings.storage.clientId}@${tenantId}`;

    const data = paramToUrlEncoded({
        grant_type: 'client_credentials',
        client_id: fullClientId,
        client_secret: settings.storage.clientSecret,
        resource: resource,
    });

    const token = await fetchToken(authUrl, data);

    tokenCache = {
        key: cacheKey,
        token,
    };
    return token;
};

const fetchToken = async (authUrl: string, body: string) => {
    const res = await fetch(authUrl, {
        method: 'POST',
        body,
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    const data = (await res.json()) as { access_token?: string };
    const rawToken = data?.access_token;

    if (!rawToken) {
        throw new Error('No token for you');
    }

    return `Bearer ${data.access_token}`;
};

const getAuthUrl = async (siteUrl: string) => {
    const ascUrl = createAscUrl(siteUrl);

    const res = await fetch(ascUrl);
    const data = (await res.json()) as { endpoints: { protocol: string; location: string }[] };

    for (let i = 0; i < data.endpoints.length; i++) {
        if (data.endpoints[i].protocol === 'OAuth2') {
            return data.endpoints[i].location;
        }
    }

    throw new Error('No OAuth2 in while asking for authUrl');
};

const createAscUrl = (siteUrl: string) => {
    const endpoints = {
        Production: 'accounts.accesscontrol.windows.net',
        China: 'accounts.accesscontrol.chinacloudapi.cn',
        German: 'login.microsoftonline.de',
        USDefence: 'accounts.accesscontrol.windows.net',
        USGovernment: 'accounts.accesscontrol.windows.net',
    };
    let endpoint = endpoints.Production;

    const host = urlLib.parse(siteUrl).host;

    if (host?.endsWith('.sharepoint.cn')) {
        endpoint = endpoints.China;
    } else if (host?.endsWith('.sharepoint.de')) {
        endpoint = endpoints.German;
    } else if (host?.endsWith('.sharepoint-mil.us')) {
        endpoint = endpoints.USDefence;
    } else if (host?.endsWith('.sharepoint.us')) {
        endpoint = endpoints.USGovernment;
    }

    return `https://${endpoint}/metadata/json/1?realm=${settings.storage.tenantId}`;
};

export const paramToUrlEncoded = (params?: Record<string, string>) => {
    let output = '';
    if (params) {
        let reducer = (res: string, key: string) => {
            if (params[key] !== undefined) return `${res}${key}=${encodeURIComponent(String(params[key]))}&`;
            return res;
        };
        output = Object.keys(params).reduce(reducer, '');
        output = output.slice(0, output.length - 1);
    }
    return output;
};
