import * as urlLib from 'url';
import fetch from 'node-fetch';

// based on node-sp-auth package, OnlineAddinOnly.js
// we cant use it cause got lib uses function generator

let tokenCache = {
    key: '',
    token: '',
};

const SharePointServicePrincipal = '00000003-0000-0ff1-ce00-000000000000';

export type TSpAuthorization = {
    url: string;
    clientSecret: string;
    clientId: string;
    tenantId: string;
};

export class SharePointAuthorization {
    constructor(private auth: TSpAuthorization) {}

    getAuthToken = async () => {
        const sharepointhostname = urlLib.parse(this.auth.url).hostname;
        const cacheKey = `${sharepointhostname}@${this.auth.clientSecret}@${this.auth.clientId}`;

        if (tokenCache.key === cacheKey) {
            return tokenCache.token;
        }

        const authUrl = await this.getAuthUrl();

        const resource = `${SharePointServicePrincipal}/${sharepointhostname}@${this.auth.tenantId}`;
        const fullClientId = `${this.auth.clientId}@${this.auth.tenantId}`;

        const data = paramToUrlEncoded({
            grant_type: 'client_credentials',
            client_id: fullClientId,
            client_secret: this.auth.clientSecret,
            resource: resource,
        });

        const token = await this.fetchToken(authUrl, data);

        tokenCache = {
            key: cacheKey,
            token,
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
        const data = (await res.json()) as { access_token?: string };
        const rawToken = data?.access_token;

        if (!rawToken) {
            throw new Error('No token for you');
        }

        return `Bearer ${data.access_token}`;
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

        return `https://${endpoint}/metadata/json/1?realm=${this.auth.tenantId}`;
    };
}

const paramToUrlEncoded = (params?: Record<string, string>) => {
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
