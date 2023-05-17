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
    enabled: boolean;
    configName: string;
    imageSettings: ImageSettings;
    cameraSettings: CameraSettings;
    coSettings: CamOverlaySettings;
};

export class HtmlToOverlay {
    private stopped = false;
    private browser: Browser;
    private page: Page;
    private startTimer: NodeJS.Timeout;
    private screenshotTimer: NodeJS.Timeout;
    private removeImageTimer: NodeJS.Timeout;
    private co: CamOverlayAPI;
    private coConnected = false;
    private coDowntimeTimer: NodeJS.Timeout;
    private takeScreenshotPromise;

    constructor(private options: HtmlToOverlayOptions) {}

    async start() {
        this.stopped = false;
        if (this.options.enabled) {
            console.log('Start overlay: ' + this.options.configName);
            await this.startBrowser();
        } else {
            this.removeImage();
            this.removeImageTimer = setInterval(() => this.removeImage(), 300_000);
        }
    }

    async stop() {
        console.log('Stop overlay: ' + this.options.configName);
        this.stopped = true;
        if (this.takeScreenshotPromise) {
            await this.takeScreenshotPromise;
        }

        clearTimeout(this.startTimer);
        clearTimeout(this.screenshotTimer);
        clearTimeout(this.removeImageTimer);

        if (this.browser) {
            await this.browser.close();
        }
        if (this.coConnected) {
            await this.removeImage();
        }
    }

    private async startBrowser() {
        try {
            if (this.browser) {
                this.browser.removeAllListeners();
                await this.browser.close();
            }

            this.browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                ignoreHTTPSErrors: true,
                handleSIGINT: false,
                handleSIGTERM: false,
            });
            this.browser.on('disconnected', () => {
                console.log('Browser disconnected');
                this.restartBrowser();
            });

            this.page = await this.browser.newPage();
            this.page.on('error', (err) => {
                console.log('Page error', err);
                this.restartBrowser();
            });
            this.page.on('close', () => {
                console.log('Page closed');
                this.restartBrowser();
            });
            await this.page.setViewport({
                width: this.options.imageSettings.renderWidth,
                height: this.options.imageSettings.renderHeight,
            });
            console.log('Go to: ' + this.options.imageSettings.url);
            await this.page.goto(this.options.imageSettings.url);

            this.takeScreenshotPromise = this.takeScreenshot();
        } catch (err) {
            this.restartBrowser();
        }
    }

    private restartBrowser() {
        if (!this.stopped) {
            clearTimeout(this.startTimer);
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
                await this.co.showCairoImageAbsolute(
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
            this.screenshotTimer = setTimeout(() => {
                this.takeScreenshotPromise = this.takeScreenshot();
            }, sleepTime);
        }
    }

    private async removeImage() {
        if (await this.startCamOverlayConnection()) {
            await this.co.removeImage();
        }
    }

    private async startCamOverlayConnection() {
        if (!this.coConnected && !this.coDowntimeTimer) {
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

            this.co.on('open', () => {
                console.log('COAPI: connected');
                this.coConnected = true;
            });

            this.co.on('error', (err) => {
                console.log('COAPI-Error: ' + err);
                this.coDowntimeTimer = setTimeout(() => {
                    this.coDowntimeTimer = undefined;
                }, 5000);
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
