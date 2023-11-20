import { SharePointAuthorization, TSpAuthorization } from './SharePointAuthorization';
import fetch from 'node-fetch';

type TSpData = TSpAuthorization & {
    outputDir: string;
};

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

    constructor(private data: TSpData) {}

    authenticate = async () => {
        const spAuth = new SharePointAuthorization(this.data);
        const authToken = await spAuth.getAuthToken();
        if (!authToken) throw new Error('Authorization is missing.');
        this.headers = { Authorization: authToken, Accept: 'application/json;odata=verbose' };
    };

    async getWebEndpoint() {
        this.checkHeaders();

        const res = await fetch(`${this.data.url}/_api/web`, {
            method: 'GET',
            headers: { ...this.headers, 'Response-Type': 'json' },
        });
        const data = await res.json();
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

    async uploadFile(file: Buffer, fileName: string) {
        this.checkHeaders();
        this.checkSite();
        const formDigestValue = await this.getFormDigestValue();

        const path = encodeURIComponent(this.data.outputDir);
        const fileNameE = encodeURIComponent(fileName);

        if (!fileNameE) {
            throw new Error('You must provide a file name.');
        }
        if (!file) {
            throw new Error('You must provide data.');
        }

        await fetch(
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
        const data = await res.json();

        return data.d.GetContextWebInformation.FormDigestValue;
    };

    private checkHeaders() {
        if (!this.headers) {
            throw new Error('No headers, you must authenticate.');
        }
    }
    private checkSite() {
        if (!this.headers) {
            throw new Error('No site, you must call getWebEndpoint.');
        }
    }
}
