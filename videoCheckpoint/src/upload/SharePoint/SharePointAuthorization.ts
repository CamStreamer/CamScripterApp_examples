import * as urlLib from 'url';

import fetch from 'node-fetch';

// Based on node-sp-auth package, OnlineAddinOnly.js
// we cant use it cause got lib uses function generator

const TOKEN_SAFE_EXPIRE_ZONE_S = 5;
let tokenCache = {
    key: '',
    token: '',
    expiresS: 0,
};

const SharePointServicePrincipal = '00000003-0000-0ff1-ce00-000000000000';

export type TSpAuthorization = {
    url: string;
    client_secret: string;
    client_id: string;
    tenant_id: string;
};

export class SharePointAuthorization {
    constructor(private auth: TSpAuthorization) {}

    getAuthToken = async () => {
        const sharepointhostname = urlLib.parse(this.auth.url).hostname;
        const cacheKey = `${sharepointhostname}@${this.auth.client_secret}@${this.auth.client_id}`;

        if (tokenCache.key === cacheKey && Date.now() / 1000 < tokenCache.expiresS) {
            return tokenCache.token;
        }

        const authUrl = await this.getAuthUrl();

        const resource = `${SharePointServicePrincipal}/${sharepointhostname}@${this.auth.tenant_id}`;
        const fullClientId = `${this.auth.client_id}@${this.auth.tenant_id}`;

        const data = paramToUrlEncoded({
            grant_type: 'client_credentials',
            client_id: fullClientId,
            client_secret: this.auth.client_secret,
            resource: resource,
        });

        const { token, expiresS } = await this.fetchToken(authUrl, data);

        tokenCache = {
            key: cacheKey,
            token,
            expiresS,
        };
        return token;
    };

    private fetchToken = async (authUrl: string, body: string) => {
        const res = await fetch(authUrl, {
            method: 'POST',
            body,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });
        const data = (await res.json()) as TTokenResponse;
        const rawToken = data?.access_token;
        const tokenType = data?.token_type;
        const tokenExpire = Date.now() / 1000 + Number(data?.expires_in ?? 0);

        if (rawToken === undefined || tokenType === undefined) {
            throw new Error('Authorization error. Check your share point credentials.');
        }

        return {
            token: `${tokenType} ${data.access_token}`,
            expiresS: tokenExpire - TOKEN_SAFE_EXPIRE_ZONE_S,
        };
    };

    private getAuthUrl = async () => {
        const ascUrl = this.createAscUrl();

        const res = await fetch(ascUrl);
        const data = (await res.json()) as { endpoints: { protocol: string; location: string }[] };

        for (let i = 0; i < data.endpoints.length; i++) {
            if (data.endpoints[i].protocol === 'OAuth2') {
                return data.endpoints[i].location;
            }
        }

        throw new Error('No OAuth2 in while asking for authUrl');
    };

    private createAscUrl = () => {
        const endpoints = {
            Production: 'accounts.accesscontrol.windows.net',
            China: 'accounts.accesscontrol.chinacloudapi.cn',
            German: 'login.microsoftonline.de',
            USDefence: 'accounts.accesscontrol.windows.net',
            USGovernment: 'accounts.accesscontrol.windows.net',
        };
        let endpoint = endpoints.Production;

        const host = urlLib.parse(this.auth.url).host;

        if (host?.endsWith('.sharepoint.cn')) {
            endpoint = endpoints.China;
        } else if (host?.endsWith('.sharepoint.de')) {
            endpoint = endpoints.German;
        } else if (host?.endsWith('.sharepoint-mil.us')) {
            endpoint = endpoints.USDefence;
        } else if (host?.endsWith('.sharepoint.us')) {
            endpoint = endpoints.USGovernment;
        }

        return `https://${endpoint}/metadata/json/1?realm=${this.auth.tenant_id}`;
    };
}

const paramToUrlEncoded = (params?: Record<string, string>) => {
    let output = '';
    if (params) {
        const reducer = (res: string, key: string) => {
            if (params[key] !== undefined) {
                return `${res}${key}=${encodeURIComponent(String(params[key]))}&`;
            }
            return res;
        };
        output = Object.keys(params).reduce(reducer, '');
        output = output.slice(0, output.length - 1);
    }
    return output;
};

type TTokenResponse = {
    access_token?: string;
    token_type?: string;
    expires_on?: string; // Timestamp in s
    expires_in?: string; // Duration in s
};
