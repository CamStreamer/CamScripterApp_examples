import puppeteer, { Browser, Page } from 'puppeteer-core';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';

export type CoordSystem = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';

export type ImageSettings = {
    url: string;
    renderWidth: number;
    renderHeight: number;
    refreshRate: number;
};

export type CameraSettings = {
    protocol: string;
    ip: string;
    port: number;
    user: string;
    pass: string;
};

export type CamOverlaySettings = {
    cameraList: number[];
    coordSystem: CoordSystem;
    posX: number;
    posY: number;
    streamWidth: number;
    streamHeight: number;
};

export type HtmlToOverlayOptions = {
    configName: string;
    imageSettings: ImageSettings;
    cameraSettings: CameraSettings;
    coSettings: CamOverlaySettings;
};

export class HtmlToOverlay {
    private browser: Browser;
    private page: Page;
    private startTimer: NodeJS.Timeout;
    private screenshotTimer: NodeJS.Timeout;
    private co: CamOverlayAPI;
    private coConnected = false;

    constructor(private options: HtmlToOverlayOptions) {}

    async start() {
        console.log('Start overlay: ' + this.options.configName);
        await this.startBrowser();
    }

    async stop() {
        console.log('Stop overlay: ' + this.options.configName);
        await this.browser.close();
        clearTimeout(this.startTimer);
        clearTimeout(this.screenshotTimer);
    }

    private async startBrowser() {
        try {
            this.browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                ignoreHTTPSErrors: true,
            });
            this.page = await this.browser.newPage();
            await this.page.setViewport({
                width: this.options.imageSettings.renderWidth,
                height: this.options.imageSettings.renderHeight,
            });
            console.log('Go to: ' + this.options.imageSettings.url);
            await this.page.goto(this.options.imageSettings.url);

            this.takeScreenshot();
        } catch (err) {
            this.startTimer = setTimeout(() => this.startBrowser(), 5000);
        }
    }

    private async takeScreenshot() {
        let sleepTime = this.options.imageSettings.refreshRate;
        try {
            if (await this.startCamOverlayConnection()) {
                const startTime = Date.now();

                const imageData = await this.page.screenshot({ type: 'png', omitBackground: true });
                const surface = (await this.co.uploadImageData(imageData)).var;
                const pos = this.computePosition(
                    this.options.coSettings.coordSystem,
                    this.options.coSettings.posX,
                    this.options.coSettings.posY,
                    this.options.imageSettings.renderWidth,
                    this.options.imageSettings.renderHeight,
                    this.options.coSettings.streamWidth,
                    this.options.coSettings.streamHeight
                );
                this.co.showCairoImageAbsolute(
                    surface,
                    pos.x,
                    pos.y,
                    this.options.coSettings.streamWidth,
                    this.options.coSettings.streamHeight
                );
                await this.co.cairo('cairo_surface_destroy', surface);

                const endTime = Date.now();
                sleepTime = Math.max(5, sleepTime - endTime + startTime);
            }
        } catch (err) {
            console.error(err);
        } finally {
            this.screenshotTimer = setTimeout(() => this.takeScreenshot(), sleepTime);
        }
    }

    private async startCamOverlayConnection() {
        if (!this.coConnected) {
            const serviceName = this.options.configName.length ? this.options.configName : 'htmlOverlay';
            this.co = new CamOverlayAPI({
                tls: this.options.cameraSettings.protocol !== 'http',
                tlsInsecure: this.options.cameraSettings.protocol === 'https_insecure',
                ip: this.options.cameraSettings.ip,
                port: this.options.cameraSettings.port,
                auth: this.options.cameraSettings.user + ':' + this.options.cameraSettings.pass,
                serviceName,
                camera: this.options.coSettings.cameraList,
            });

            this.co.on('open', (err) => {
                this.coConnected = true;
            });

            this.co.on('error', (err) => {
                console.log('COAPI-Error: ' + err);
            });

            this.co.on('close', () => {
                console.log('COAPI-Error: connection closed');
                this.coConnected = false;
            });

            await this.co.connect();
        }
        return this.coConnected;
    }

    private computePosition(
        coordSystem: CoordSystem,
        posX: number,
        posY: number,
        width: number,
        height: number,
        streamWidth: number,
        streamHeight: number
    ) {
        let x = posX;
        let y = posY;
        switch (coordSystem) {
            case 'top_right':
                x = streamWidth - width - posX;
                break;
            case 'bottom_left':
                y = streamHeight - height - posY;
                break;
            case 'bottom_right':
                x = streamWidth - width - posX;
                y = streamHeight - height - posY;
                break;
        }
        return { x, y };
    }
}
