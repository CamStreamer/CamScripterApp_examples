import * as fs from 'fs';
import { TServerData } from '../schema';
import {
    CamOverlayDrawingAPI,
    TCairoCreateResponse,
    CamOverlayDrawingOptions,
} from 'camstreamerlib/CamOverlayDrawingAPI';

export class Widget {
    private cod: CamOverlayDrawingAPI;
    private coReady = false;
    private barcodeFont?: string;
    private visibilityTimer?: NodeJS.Timeout;

    constructor(cameraSettings: TServerData['output_camera'], private widgetSettings: TServerData['widget']) {
        const options: CamOverlayDrawingOptions = {
            tls: cameraSettings.protocol !== 'http',
            tlsInsecure: cameraSettings.protocol === 'https_insecure',
            ip: cameraSettings.ip,
            port: cameraSettings.port,
            user: cameraSettings.user,
            pass: cameraSettings.pass,
            camera: widgetSettings.camera_list,
        };
        this.cod = new CamOverlayDrawingAPI(options);
        this.coConnect();
    }

    async showBarCode(text: string, visibilityTimeSec: number) {
        try {
            if (!this.coReady) {
                return;
            }
            if (this.barcodeFont === undefined) {
                this.barcodeFont = await this.uploadFont();
            }
            await this.renderWidget(text, this.cod);

            clearTimeout(this.visibilityTimer);
            if (visibilityTimeSec !== 0) {
                this.visibilityTimer = setTimeout(() => {
                    if (this.coReady) {
                        void this.cod.removeImage();
                    }
                }, visibilityTimeSec * 1000);
            }
        } catch (err) {
            console.error(err);
        }
    }

    private coConnect() {
        this.cod.removeAllListeners();

        this.cod.on('open', () => {
            console.log('COAPI connected');
            this.coReady = true;
        });

        this.cod.on('error', (err) => {
            console.log('COAPI-Error: ' + err);
        });

        this.cod.on('close', () => {
            console.log('COAPI-Error: connection closed');
            this.coReady = false;
            this.barcodeFont = undefined;
        });

        this.cod.connect();
    }

    async renderWidget(text: string, cod: CamOverlayDrawingAPI) {
        const scaleFactor = this.widgetSettings.scale / 100;
        const resolution = this.widgetSettings.stream_resolution.split('x').map(Number);
        const widgetWidth = Math.round(600 * scaleFactor);
        const widgetHeight = Math.round(130 * scaleFactor);
        const surfaceResponse = (await cod.cairo(
            'cairo_image_surface_create',
            'CAIRO_FORMAT_ARGB32',
            widgetWidth,
            widgetHeight
        )) as TCairoCreateResponse;
        const surface = surfaceResponse.var;
        const cairoResponse = (await cod.cairo('cairo_create', surface)) as TCairoCreateResponse;
        const cairo = cairoResponse.var;

        // Measure the size of the barcode
        void cod.cairo('cairo_set_font_face', cairo, this.barcodeFont);
        void cod.cairo('cairo_set_font_size', cairo, 70);
        const textExtents = ((await cod.cairo('cairo_text_extents', cairo, `*${text}*`)) as any).var;
        const margin = 60;
        const barcodeWidth = Math.min(600 - margin, textExtents.width);

        // Fill the background
        void cod.cairo('cairo_scale', cairo, scaleFactor, scaleFactor);
        void cod.cairo('cairo_rectangle', cairo, 0, 0, barcodeWidth + margin, 320);
        void cod.cairo('cairo_set_source_rgb', cairo, 1.0, 1.0, 1.0);
        void cod.cairo('cairo_fill', cairo);
        void cod.cairo('cairo_stroke', cairo);

        // Write the barcode and the text below it
        const textPos = margin / 2;
        void cod.cairo('cairo_set_font_face', cairo, this.barcodeFont);
        void cod.cairo('cairo_set_font_size', cairo, 70);
        void cod.cairo('cairo_set_source_rgb', cairo, 0.0, 0.0, 0.0);
        void cod.writeText(cairo, `*${text}*`, textPos, 5, barcodeWidth, 70, 'A_CENTER', 'TFM_SCALE');

        void cod.cairo('cairo_set_font_face', cairo, 'NULL');
        void cod.writeText(cairo, text, textPos, 80, barcodeWidth, 30, 'A_CENTER', 'TFM_SCALE');

        const pos = this.computePosition(
            this.widgetSettings.coord_system,
            this.widgetSettings.pos_x,
            this.widgetSettings.pos_y,
            (barcodeWidth + margin) * scaleFactor,
            widgetHeight,
            resolution[0],
            resolution[1]
        );
        await cod.showCairoImageAbsolute(surface, pos.x, pos.y, resolution[0], resolution[1]);

        void cod.cairo('cairo_surface_destroy', surface);
        void cod.cairo('cairo_destroy', cairo);
    }

    private async uploadFont() {
        const imgData = fs.readFileSync('fonts/fre3of9x.ttf');
        const fontRes = await this.cod.uploadFontData(imgData);
        return fontRes.var;
    }

    private computePosition(
        coordSystem: TServerData['widget']['coord_system'],
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
