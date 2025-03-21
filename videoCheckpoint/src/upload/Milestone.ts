import * as net from 'net';
import { TServerData } from '../schema';

export class Milestone {
    private milestoneClient: net.Socket | null = null;

    constructor(private milestoneSettings: TServerData['milestone']) {
        this.serverConnect();
    }

    serverConnect() {
        const server = net.createServer((client) => {
            if (this.milestoneClient) {
                console.log('Closing connection to the previous Milestone client.');
                this.milestoneClient.end();
                this.milestoneClient.destroy();
            }

            this.milestoneClient = client;
            console.log('Milestone client connected');

            client.on('end', () => {
                console.log('Milestone client disconnected.');
                this.milestoneClient = null;
            });
        });

        server.listen(this.milestoneSettings.port, () => {
            server.on('close', () => {
                console.log('Milestone: TCP server socket is closed.');
                process.exit(1);
            });

            server.on('error', (error) => {
                console.log(JSON.stringify(error));
                process.exit(1);
            });
        });
    }

    sendEvent(code: string) {
        const validatedCode = code.trim().split(' ').join('');
        const message = `${this.milestoneSettings.transaction_source} ${validatedCode}\n`;
        if (this.milestoneClient) {
            this.milestoneClient.write(message, (err) => {
                if (err) {
                    console.error('Error sending data to Milestone:', err);
                } else {
                    console.log('Data sent to Milestone:', `${this.milestoneSettings.transaction_source} ${code}`);
                }
            });
        } else {
            console.log('No Milestone client connected.');
        }
    }
}
