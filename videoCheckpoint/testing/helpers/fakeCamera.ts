import * as http from 'http';
import * as assert from 'assert';
import { createDeferred } from './deferred';

export type TExportBehaviour = {
    status?: number;
    chunks?: number;
    chunkSize?: number;
    chunkIntervalMs?: number;
};

export type TExportConnection = {
    query: URLSearchParams;
    openedAt: number;
    bytesSent: number;
    finished: boolean;
    finishedAt?: number;
    closedEarly: Promise<void>;
};

const recordingListXml = (sources: number[]) =>
    `<?xml version="1.0"?><root><recordings>${sources
        .map(
            (source) =>
                `<recording diskid="SD_DISK" recordingid="rec_${source}" source="${source}" recordingstatus="recording"></recording>`
        )
        .join('')}</recordings></root>`;

const SCHEMA_XML = '<?xml version="1.0"?><root><VersionNumber>1.4</VersionNumber></root>';

const chunkByte = (index: number) => index % 251;

export class FakeCamera {
    private readonly requestedPaths: string[] = [];
    readonly exports: TExportConnection[] = [];
    recordingSources = [1];
    exportBehaviour: TExportBehaviour = {};
    listStatus = 200;
    private server = http.createServer((req, res) => this.handle(req, res));

    async start() {
        await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve));
        const address = this.server.address();
        assert.ok(typeof address === 'object' && address !== null);
        return address.port;
    }

    async stop() {
        this.server.closeAllConnections();
        await new Promise<void>((resolve) => this.server.close(() => resolve()));
    }

    countRequests(path: string) {
        return this.requestedPaths.filter((p) => p === path).length;
    }

    expectedExportBytes() {
        const { chunks = 4, chunkSize = 1024 } = this.exportBehaviour;
        return chunks * chunkSize;
    }

    private handle(req: http.IncomingMessage, res: http.ServerResponse) {
        const url = new URL(req.url ?? '/', 'http://camera');
        this.requestedPaths.push(url.pathname);

        switch (url.pathname) {
            case '/axis-cgi/record/list.cgi':
                if (this.listStatus !== 200) {
                    res.writeHead(this.listStatus);
                    res.end('error');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(recordingListXml(this.recordingSources));
                return;
            case '/axis-cgi/record/storage/schemaversions.cgi':
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(SCHEMA_XML);
                return;
            case '/axis-cgi/record/export/exportrecording.cgi':
                this.streamExport(url.searchParams, res);
                return;
            default:
                res.writeHead(404);
                res.end();
        }
    }

    private streamExport(query: URLSearchParams, res: http.ServerResponse) {
        const { status = 200, chunks = 4, chunkSize = 1024, chunkIntervalMs = 0 } = this.exportBehaviour;
        const closedEarly = createDeferred();
        const connection: TExportConnection = {
            query,
            openedAt: Date.now(),
            bytesSent: 0,
            finished: false,
            closedEarly: closedEarly.promise,
        };
        this.exports.push(connection);

        if (status !== 200) {
            res.writeHead(status);
            res.end('error');
            return;
        }

        res.writeHead(200, { 'Content-Type': 'video/x-matroska' });
        res.on('close', () => {
            if (!connection.finished) {
                closedEarly.resolve();
            }
        });

        let sent = 0;
        const sendNext = () => {
            if (res.destroyed) {
                return;
            }
            if (sent === chunks) {
                connection.finished = true;
                connection.finishedAt = Date.now();
                res.end();
                return;
            }
            res.write(Buffer.alloc(chunkSize, chunkByte(sent)));
            connection.bytesSent += chunkSize;
            sent += 1;
            setTimeout(sendNext, chunkIntervalMs);
        };
        sendNext();
    }
}
