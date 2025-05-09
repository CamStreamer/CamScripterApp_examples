import { TServerData } from './schema';
import {
    CamOverlayDrawingAPI,
    TCairoCreateResponse,
    CamOverlayDrawingOptions,
} from 'camstreamerlib/CamOverlayDrawingAPI';

export class Widget {
    private cod: CamOverlayDrawingAPI;
    private coReady = false;

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

    async displayWidget(text: string) {
        console.log('Showing barcode: ' + text);
        try {
            console.log('co ready: ' + this.coReady);
            if (!this.coReady) {
                return;
            }
            await this.renderWidget(text, this.cod);
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
        });

        this.cod.connect();
    }

    async renderWidget(text: string, cod: CamOverlayDrawingAPI) {
        console.log('Rendering widget');
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

        // Fill the background with a white rectangle
        void cod.cairo('cairo_set_source_rgb', cairo, 1.0, 1.0, 1.0); // White color
        void cod.cairo('cairo_rectangle', cairo, 0, 0, widgetWidth, widgetHeight);
        void cod.cairo('cairo_fill', cairo);

        // Write the black text on top
        void cod.cairo('cairo_set_source_rgb', cairo, 0.0, 0.0, 0.0); // Black color
        void cod.cairo('cairo_set_font_size', cairo, 50); // Set font size
        const textExtents = ((await cod.cairo('cairo_text_extents', cairo, text)) as any).var;
        const textX = (widgetWidth - textExtents.width) / 2; // Center the text horizontally
        const textY = (widgetHeight + textExtents.height) / 2; // Center the text vertically
        void cod.cairo('cairo_move_to', cairo, textX, textY);
        void cod.cairo('cairo_show_text', cairo, text);

        const pos = this.computePosition(
            this.widgetSettings.coord_system,
            this.widgetSettings.pos_x,
            this.widgetSettings.pos_y,
            widgetWidth,
            widgetHeight,
            resolution[0],
            resolution[1]
        );
        await cod.showCairoImageAbsolute(surface, pos.x, pos.y, resolution[0], resolution[1]);

        void cod.cairo('cairo_surface_destroy', surface);
        void cod.cairo('cairo_destroy', cairo);
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
