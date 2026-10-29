import * as net from 'net';
import * as assert from 'assert';

export type TStoredFile = {
    path: string;
    bytes: Buffer;
    complete: boolean;
};

const listen = async (server: net.Server) => {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert.ok(typeof address === 'object' && address !== null);
    return address.port;
};

// Just enough of RFC 959 + EPSV for basic-ftp's access() and uploadFrom(), so the real client runs end to end.
export class MiniFtpServer {
    readonly files: TStoredFile[] = [];
    logins = 0;
    abortNextTransfersAfterBytes?: number;
    private sockets = new Set<net.Socket>();
    private dataServers = new Set<net.Server>();
    private server = net.createServer((socket) => this.handleControl(socket));

    start() {
        return listen(this.server);
    }

    async stop() {
        this.sockets.forEach((socket) => socket.destroy());
        this.dataServers.forEach((dataServer) => dataServer.close());
        await new Promise<void>((resolve) => this.server.close(() => resolve()));
    }

    completeFiles() {
        return this.files.filter((f) => f.complete);
    }

    private track(socket: net.Socket) {
        this.sockets.add(socket);
        socket.on('close', () => this.sockets.delete(socket));
        socket.on('error', () => undefined);
    }

    private handleControl(control: net.Socket) {
        this.track(control);
        const reply = (line: string) => control.write(line + '\r\n');
        let pendingData: Promise<net.Socket> | undefined;
        let buffered = '';

        const handleCommand = async (line: string) => {
            const [command, ...rest] = line.split(' ');
            const argument = rest.join(' ');
            switch (command.toUpperCase()) {
                case 'USER':
                    reply('331 Password required');
                    return;
                case 'PASS':
                    this.logins += 1;
                    reply('230 Logged in');
                    return;
                case 'TYPE':
                    reply('200 OK');
                    return;
                case 'EPSV': {
                    const dataServer = net.createServer();
                    this.dataServers.add(dataServer);
                    const port = await listen(dataServer);
                    pendingData = new Promise((resolve) =>
                        dataServer.once('connection', (socket) => {
                            this.track(socket);
                            dataServer.close();
                            this.dataServers.delete(dataServer);
                            resolve(socket);
                        })
                    );
                    reply(`229 Entering Extended Passive Mode (|||${port}|)`);
                    return;
                }
                case 'STOR': {
                    assert.ok(pendingData !== undefined, 'STOR without EPSV');
                    const data = await pendingData;
                    pendingData = undefined;
                    this.receive(data, argument, reply);
                    reply('150 Ready');
                    return;
                }
                case 'QUIT':
                    reply('221 Bye');
                    control.end();
                    return;
                default:
                    reply('502 Not implemented');
            }
        };

        let queue = Promise.resolve();
        control.on('data', (chunk) => {
            buffered += chunk.toString();
            let newline = buffered.indexOf('\r\n');
            while (newline !== -1) {
                const line = buffered.slice(0, newline);
                buffered = buffered.slice(newline + 2);
                queue = queue.then(() => handleCommand(line));
                newline = buffered.indexOf('\r\n');
            }
        });
        reply('220 MiniFtpServer');
    }

    private receive(data: net.Socket, path: string, reply: (line: string) => void) {
        const file: TStoredFile = { path, bytes: Buffer.alloc(0), complete: false };
        this.files.push(file);
        const abortAfter = this.abortNextTransfersAfterBytes;
        this.abortNextTransfersAfterBytes = undefined;
        const chunks: Buffer[] = [];
        let received = 0;

        data.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
            received += chunk.length;
            if (abortAfter !== undefined && received >= abortAfter) {
                data.destroy();
                file.bytes = Buffer.concat(chunks);
                reply('426 Connection closed; transfer aborted');
            }
        });
        data.on('end', () => {
            file.bytes = Buffer.concat(chunks);
            file.complete = true;
            reply('226 Transfer complete');
        });
    }
}
