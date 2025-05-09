import { TServerData } from './schema';
import { TData } from './main';
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

    async displayWidget(data: TData, unit: 'M' | 'I') {
        try {
            if (!this.coReady) {
                return;
            }
            const temperatureUnit = unit === 'I' ? '°F' : '°C';
            await this.renderWidget(data, temperatureUnit, this.cod);
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

    async renderWidget(data: TData, temperatureUnit: string, cod: CamOverlayDrawingAPI) {
        console.log('Rendering widget:', data);

        const temperature = `${data.Temperature} ${temperatureUnit}`;
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
