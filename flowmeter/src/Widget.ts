import { CamOverlayDrawingAPI } from 'camstreamerlib/CamOverlayDrawingAPI';
import { TSettings } from './schema';
import { MemoryManager } from './MemoryManager';
import CairoPainter from './CairoPainter';
import CairoFrame from './CairoFrame';

type TLayout = {
    background: CairoPainter;
    startTime: CairoFrame;
    currentTime: CairoFrame;
    beerBackground: CairoFrame;
    currentBeer: CairoFrame;
    beerCount: CairoFrame;
    volume: CairoFrame;
    groupName: CairoFrame;
};

export class Widget {
    private cod: CamOverlayDrawingAPI;
    private coConnected = false;
    private mm?: MemoryManager;
    private layout?: TLayout;
    private layoutReady = false;
    private widgetBg: string;
    private widgetBeerType: string;

    constructor(private settings: TSettings) {
        const options = {
            ip: this.settings.camera_ip,
            port: this.settings.camera_port,
            auth: `${this.settings.camera_user}:${this.settings.camera_pass}`,
            tls: false,
        };
        this.widgetBeerType = this.settings.overlay_type === 'birel' ? 'birel' : 'beer';
        this.widgetBg = this.settings.overlay_type === 'axis_beer' ? 'bg' : `bg-${this.widgetBeerType}`;

        this.cod = new CamOverlayDrawingAPI(options);
    }

    stop() {
        this.cod.removeAllListeners();
        this.cod.disconnect();
    }

    async updateVolume(volume: number) {
        try {
            if (!(await this.coConnect())) {
                return;
            }

            if (!this.layout || !this.mm) {
                return;
            }

            const date = new Date();
            const hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            this.layout.currentTime.setText(hours + ':' + minutes, 'A_CENTER');

            this.layout.currentBeer.setBgImage(await this.mm.image(this.getBeerIndex(volume)), 'fit');

            this.layout.volume.setText(volume.toFixed(2) + ' l', 'A_CENTER');
            this.layout.beerCount.setText(Math.floor(volume * 2).toString(), 'A_RIGHT');

            await this.layout.background.generate(this.cod, this.settings.scale / 100);
        } catch (err) {
            console.error('Generate widget error: ', err);
        }
    }

    private async coConnect() {
        if (!this.coConnected) {
            this.coConnected = true;
            this.cod.removeAllListeners();

            this.cod.on('open', async () => {
                console.log('COAPI connected');
                this.mm = new MemoryManager(this.cod);
                this.prepareImages(this.mm);
                this.layout = await this.createLayout(this.mm);
                this.layoutReady = true;
            });

            this.cod.on('error', (err) => {
                console.log('COAPI-Error: ' + err);
            });

            this.cod.on('close', () => {
                console.log('COAPI-Error: connection closed');
                this.coConnected = false;
                this.layoutReady = false;
            });

            await this.cod.connect();
        }
        return this.layoutReady;
    }

    private prepareImages(mm: MemoryManager) {
        mm.registerImage('bg-birel', 'birel_bg.png');
        mm.registerImage('bg-beer', 'beer_bg.png');
        mm.registerImage('bg', 'axis_bg.png');

        mm.registerImage('beer-1', 'beer-empty.png');
        mm.registerImage('beer-2', 'beer-almost-empty.png');
        mm.registerImage('beer-3', 'beer-almost-full.png');
        mm.registerImage('beer-4', 'beer-full.png');

        mm.registerImage('birel-1', 'birel-empty.png');
        mm.registerImage('birel-2', 'birel-almost-empty.png');
        mm.registerImage('birel-3', 'birel-almost-full.png');
        mm.registerImage('birel-4', 'birel-full.png');
    }

    private async createLayout(mm: MemoryManager) {
        const resolution = this.settings.resolution.split('x').map(Number);
        const background = new CairoPainter({
            x: this.settings.pos_x,
            y: this.settings.pos_y,
            width: 500,
            height: 760,
            screenWidth: resolution[0],
            screenHeight: resolution[1],
            coAlignment: this.settings.coord,
        });
        background.setBgImage(await mm.image(this.widgetBg), 'fit');

        const startTime = new CairoFrame({
            x: 35,
            y: 205,
            width: 180,
            height: 48,
        });
        startTime.setText(this.settings.start_time, 'A_CENTER');

        const currentTime = new CairoFrame({
            x: 260,
            y: 205,
            width: 180,
            height: 48,
        });
        currentTime.setText('12:20', 'A_CENTER');

        const beerBackground = new CairoFrame({
            x: 90,
            y: 355,
            width: 110,
            height: 128,
        });
        beerBackground.setBgImage(await mm.image(`${this.widgetBeerType}-4`), 'fit');

        const currentBeer = new CairoFrame({
            x: 310,
            y: 355,
            width: 110,
            height: 128,
        });
        currentBeer.setBgImage(await mm.image(`${this.widgetBeerType}-1`), 'fit');

        const beerCount = new CairoFrame({
            x: 45,
            y: 275,
            width: 100,
            height: 48,
        });
        beerCount.setText('24', 'A_RIGHT');

        const volume = new CairoFrame({
            x: 50,
            y: 500,
            width: 400,
            height: 80,
        });
        volume.setText('62.00 l', 'A_CENTER');

        const groupName = new CairoFrame({
            x: 50,
            y: 595,
            width: 400,
            height: 40,
        });
        groupName.setText(this.settings.group_name, 'A_CENTER');

        background.insert(startTime, currentTime, beerBackground, currentBeer, beerCount, volume, groupName);
        return {
            background,
            startTime,
            currentTime,
            currentBeer,
            beerBackground,
            beerCount,
            volume,
            groupName,
        };
    }

    private getBeerIndex(volumeLiters: number) {
        const ml = (volumeLiters % 0.5) * 1000;
        if (ml < 125) {
            return `${this.widgetBeerType}-1`;
        } else if (ml < 250) {
            return `${this.widgetBeerType}-2`;
        } else if (ml < 375) {
            return `${this.widgetBeerType}-3`;
        } else {
            return `${this.widgetBeerType}-4`;
        }
    }
}
