import { getCameraHttpSettings, settings } from '../settings';
import { CamOverlayDrawingAPI, CairoCreateResponse } from 'camstreamerlib/CamOverlayDrawingAPI';
type CoordSystem = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';

export class DrawWidget {
    co: CamOverlayDrawingAPI;
    constructor() {
        this.co = new CamOverlayDrawingAPI(getCameraHttpSettings());

        this.co.on('open', () => {
            console.log('COAPI: connected');
        });

        this.co.on('error', (err) => {
            console.log('COAPI-Error: ' + err);
        });

        this.co.on('close', () => {
            console.log('COAPI-Error: connection closed');
        });
    }

    connect = async () => {
        await this.co.connect();
    };

    createBarcodeWidget = async (text: string) => {
        const co = this.co;
        const widgetWidth = Math.round(600 * 1);
        const widgetHeight = Math.round(130 * 1);
        const surfaceResponse = (await co.cairo(
            'cairo_image_surface_create',
            'CAIRO_FORMAT_ARGB32',
            widgetWidth,
            widgetHeight
        )) as CairoCreateResponse;
        const surface = surfaceResponse.var;
        const cairoResponse = (await co.cairo('cairo_create', surface)) as CairoCreateResponse;
        const cairo = cairoResponse.var;

        // Measure the size of the barcode
        co.cairo('cairo_set_font_size', cairo, 70);
        const textExtents = ((await co.cairo('cairo_text_extents', cairo, `*${text}*`)) as any).var;
        const margin = 60;
        const barcodeWidth = Math.min(600 - margin, textExtents.width);

        // Fill the background
        co.cairo('cairo_scale', cairo, 1, 1);
        co.cairo('cairo_rectangle', cairo, 0, 0, barcodeWidth + margin, 320);
        co.cairo('cairo_set_source_rgb', cairo, 1.0, 1.0, 1.0);
        co.cairo('cairo_fill', cairo);

        // Write the barcode and the text below it
        const textPos = margin / 2;
        co.cairo('cairo_set_font_size', cairo, 70);
        co.cairo('cairo_set_source_rgb', cairo, 0.0, 0.0, 0.0);
        co.writeText(cairo, `*${text}*`, textPos, 5, barcodeWidth, 70, 'A_CENTER', 'TFM_SCALE');

        co.writeText(cairo, text, textPos, 80, barcodeWidth, 30, 'A_CENTER', 'TFM_SCALE');

        const pos = this.computePosition('top_left', 10, 10, (barcodeWidth + margin) * 1, widgetHeight, 1920, 1080);
        await co.showCairoImageAbsolute(surface, pos.x, pos.y, 100, 50);

        co.cairo('cairo_surface_destroy', surface);
        co.cairo('cairo_destroy', cairo);
    };

    computePosition = (
        coordSystem: CoordSystem,
        posX: number,
        posY: number,
        width: number,
        height: number,
        streamWidth: number,
        streamHeight: number
    ) => {
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
    };
}
