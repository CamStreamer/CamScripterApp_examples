import * as fs from 'fs';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import { CamOverlayDrawingAPI } from 'camstreamerlib/CamOverlayDrawingAPI';
import { TOverlaySettings } from './settingsSchema';

export class HtmlToOverlay {
    private stopped = false;
    private browser?: Browser;
    private page?: Page;
    private startTimer?: NodeJS.Timeout;
    private co?: CamOverlayDrawingAPI;
    private coConnected = false;
    private screenshotTimer?: NodeJS.Timeout;
    private takeScreenshotPromise?: Promise<void>;

    constructor(private options: TOverlaySettings) {}

    start() {
        this.stopped = false;
        console.log('Start overlay: ' + this.options.configName);
        this.startCamOverlayConnection();
        void this.startBrowser();
    }

    async stop() {
        try {
            console.log('Stop overlay: ' + this.options.configName);
            this.stopped = true;

            if (this.takeScreenshotPromise) {
                await this.takeScreenshotPromise;
            }

            clearTimeout(this.startTimer);
            clearTimeout(this.screenshotTimer);

            await this.browser?.close();
        } catch (err) {
            console.log('Stop overlay: ' + this.options.configName, err);
        }
    }

    private async startBrowser() {
        try {
            this.browser?.removeAllListeners();
            await this.browser?.close();

            const chromiumNew = fs.existsSync('/usr/bin/chromium-browser');
            const chromiumDeb = fs.existsSync('/usr/bin/chromium'); // Deb version on the newest Ubuntu
            const chrome = fs.existsSync('/usr/bin/google-chrome');

            let executablePath = '';
            if (chromiumNew) {
                executablePath = '/usr/bin/chromium-browser';
            } else if (chromiumDeb) {
                executablePath = '/usr/bin/chromium';
            } else if (chrome) {
                executablePath = '/usr/bin/google-chrome';
            } else {
                throw new Error('Chromium or Chrome not found');
            }

            this.browser = await puppeteer.launch({
                executablePath,
                acceptInsecureCerts: true,
                handleSIGINT: false,
                handleSIGTERM: false,
            });
            this.browser.on('disconnected', () => {
                console.log('Browser disconnected');
                this.restartBrowser();
            });

            this.page = await this.browser.newPage();
            this.page.on('error', (err) => {
                console.log('Page:', err);
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
            console.error('Browser:', err);
            this.restartBrowser();
        }
    }

    private restartBrowser() {
        clearTimeout(this.startTimer);
        this.startTimer = setTimeout(async () => {
            if (!this.stopped) {
                await this.startBrowser();
            }
        }, 5000);
    }

    private async takeScreenshot() {
        let sleepTime = 5000;
        try {
            if (!this.co || !this.coConnected || !this.page) {
                return;
            }

            const startTime = Date.now();

            const imageData = await this.page.screenshot({ type: 'png', omitBackground: true });
            const surface = (await this.co.uploadImageData(Buffer.from(imageData))).var;
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
            sleepTime = Math.max(5, this.options.imageSettings.refreshRate - endTime + startTime);
        } catch (err) {
            console.error(this.options.configName, err);
        } finally {
            this.screenshotTimer = setTimeout(() => {
                this.takeScreenshotPromise = this.takeScreenshot();
            }, sleepTime);
        }
    }

    private startCamOverlayConnection() {
        if (this.co) {
            return;
        }

        this.co = new CamOverlayDrawingAPI({
            tls: this.options.cameraSettings.protocol !== 'http',
            tlsInsecure: this.options.cameraSettings.protocol === 'https_insecure',
            ip: this.options.cameraSettings.ip,
            port: this.options.cameraSettings.port,
            user: this.options.cameraSettings.user,
            pass: this.options.cameraSettings.pass,
            camera: this.options.coSettings.cameraList ?? undefined,
        });

        this.co.on('open', () => {
            console.log(`COAPI: ${this.options.configName}: connected`);
            this.coConnected = true;
        });

        this.co.on('error', (err) => {
            console.log(`COAPI-Error: ${this.options.configName}:`, err.message);
        });

        this.co.on('close', () => {
            console.log(`COAPI-Error: ${this.options.configName}: connection closed`);
            this.coConnected = false;
        });
        this.co.connect();
    }

    private computePosition(
        coordSystem: TOverlaySettings['coSettings']['coordSystem'],
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
