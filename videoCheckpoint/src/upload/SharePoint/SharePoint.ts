import { SharePointAuthorization, TSpAuthorization } from './SharePointAuthorization';

import fetch from 'node-fetch';

type TSpData = TSpAuthorization & {
    output_dir: string;
};

const SITE_EXPIRATION_S = 24 * 60 * 60;

export class SharePoint {
    headers: Record<string, string> | null = null;
    site: {
        id: string;
        title: string;
        description: string;
        created: string;
        serverRelativeUrl: string;
        lastModified: string;
    } | null = null;
    siteExpiresAtS = 0;

    constructor(private data: TSpData) {}

    authenticate = async () => {
        const spAuth = new SharePointAuthorization(this.data);
        const authToken = await spAuth.getAuthToken();
        if (!authToken) {
            throw new Error('Authorization is missing.');
        }
        this.headers = { Authorization: authToken, Accept: 'application/json;odata=verbose' };

        if (Date.now() / 1000 > this.siteExpiresAtS) {
            await this.getWebEndpoint();
            this.siteExpiresAtS = Date.now() / 1000 + SITE_EXPIRATION_S;
        }
    };

    async getWebEndpoint() {
        this.checkHeaders();

        const res = await fetch(`${this.data.url}/_api/web`, {
            method: 'GET',
            headers: { ...this.headers, 'Response-Type': 'json' },
        });
        const data = (await res.json()) as any;
        const site = data.d;

        this.site = {
            id: site.Id,
            title: site.Title,
            description: site.Description,
            created: site.Created,
            serverRelativeUrl: site.ServerRelativeUrl,
            lastModified: site.LastItemUserModifiedDate,
        };
    }

    async uploadFile(file: Buffer, fileName: string, dir: string) {
        this.checkHeaders();
        this.checkSite();
        const formDigestValue = await this.getFormDigestValue();

        const path = encodeURIComponent(this.data.output_dir + dir);
        const fileNameE = encodeURIComponent(fileName);

        if (!fileNameE) {
            throw new Error('You must provide a file name.');
        }

        const res = await fetch(
            `${this.data.url}/_api/web/GetFolderByServerRelativeUrl('${
                this.site!.serverRelativeUrl
            }${path}')/Files/add(url='${fileName}', overwrite=true)`,
            {
                method: 'post',
                body: file,
                headers: {
                    ...this.headers,
                    'X-RequestDigest': formDigestValue,
                },
            }
        );

        const data = (await res.json()) as any;
        if (data.error !== undefined) {
            console.log(data.error);
            throw new Error('image was not uploaded due to error');
        }
    }

    async createFolder(name: string) {
        this.checkHeaders();
        this.checkSite();
        const formDigestValue = await this.getFormDigestValue();

        const dirPath = encodeURIComponent(`${this.data.output_dir}/${name}`);

        await fetch(`${this.data.url}/_api/web/folders`, {
            method: 'post',
            headers: {
                ...this.headers,
                'content-type': 'application/json;odata=verbose',
                'X-RequestDigest': formDigestValue,
                'Response-Type': 'json',
            },
            body: JSON.stringify({
                __metadata: { type: 'SP.Folder' },
                ServerRelativeUrl: `${this.site!.serverRelativeUrl}${dirPath}`,
            }),
        });
    }

    private getFormDigestValue = async () => {
        this.checkHeaders();

        const res = await fetch(`${this.data.url}/_api/contextinfo`, {
            method: 'post',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json;odata=verbose',
                'Response-Type': 'json',
            },
        });
        const data = (await res.json()) as any;

        return data.d.GetContextWebInformation.FormDigestValue;
    };

    private checkHeaders() {
        if (!this.headers) {
            throw new Error('No headers, you must authenticate.');
        }
    }
    private checkSite() {
        if (!this.site) {
            throw new Error('No site, you must call getWebEndpoint.');
        }
    }
}
