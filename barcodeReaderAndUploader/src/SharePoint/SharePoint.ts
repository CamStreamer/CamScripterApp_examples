import { SharePointAuthorization, TSpAuthorization } from './SharePointAuthorization';

type TSpData = TSpAuthorization;

export class SharePoint {
    headers: Record<string, string> = {};

    constructor(private data: TSpData) {}

    authenticate = async () => {
        const spAuth = new SharePointAuthorization(this.data);
        const authToken = await spAuth.getAuthToken();
        if (!authToken) throw new Error('Authorization is missing.');
        this.headers = { Authorization: authToken, Accept: 'application/json;odata=verbose' };
    };
}
