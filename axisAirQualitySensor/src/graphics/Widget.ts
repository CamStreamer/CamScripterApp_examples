import * as fs from 'fs';

import { TServerData } from '../schema';
import { TData, TInfo, SEVERITY, FONT, POS, GRAM_UNIT } from '../constants';
import {
    CamOverlayDrawingAPI,
    TCairoCreateResponse,
    CamOverlayDrawingOptions,
} from 'camstreamerlib/CamOverlayDrawingAPI';

export class Widget {
    private cod: CamOverlayDrawingAPI;
    private coReady = false;
    private fontRegular: string | undefined;
    private fontBold: string | undefined;
    private background: string | undefined;
    private gif: string | undefined;

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

    async displayWidget(data: Record<keyof TData, TInfo>, unit: 'F' | 'C') {
        try {
            if (!this.coReady) {
                return;
            }
            if (this.fontRegular === undefined) {
                this.fontRegular = await this.uploadFont('OpenSans-Regular.ttf');
            }
            if (this.fontBold === undefined) {
                this.fontBold = await this.uploadFont('OpenSans-Bold.ttf');
            }
            if (this.background === undefined) {
                this.background = await this.uploadImage('background/axis-air-quality-widget.png');
            }
            await this.renderWidget(data, `°${unit}`, this.cod);
        } catch (err) {
            console.error(err);
        }
    }

    private coConnect() {
        this.cod.removeAllListeners();

        this.cod.on('open', () => {
            console.log('COAPI connected');

            this.fontRegular = undefined;
            this.fontBold = undefined;
            this.background = undefined;
            this.gif = undefined;

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

    async renderWidget(data: Record<keyof TData, TInfo>, unit: string, cod: CamOverlayDrawingAPI) {
        const scaleFactor = this.widgetSettings.scale / 100;
        const resolution = this.widgetSettings.stream_resolution.split('x').map(Number);
        const widgetWidth = Math.round(1700 * scaleFactor);
        const widgetHeight = Math.round(544 * scaleFactor);

        const surfaceResponse = (await cod.cairo(
            'cairo_image_surface_create',
            'CAIRO_FORMAT_ARGB32',
            widgetWidth,
            widgetHeight
        )) as TCairoCreateResponse;
        const surface = surfaceResponse.var;
        const cairoResponse = (await cod.cairo('cairo_create', surface)) as TCairoCreateResponse;
        const cairo = cairoResponse.var;

        // Set scale factor
        void cod.cairo('cairo_scale', cairo, scaleFactor, scaleFactor);

        // Draw the background
        if (this.background) {
            void cod.cairo('cairo_set_source_surface', cairo, this.background, 0, 0);
            void cod.cairo('cairo_paint', cairo);
        }

        void cod.cairo('cairo_set_font_face', cairo, this.fontBold);

        // Draw severity lines
        this.drawLine(cod, cairo, 43, 533, 121, SEVERITY[data.Humidity.severity]);
        this.drawLine(cod, cairo, 43, 533, 247, SEVERITY[data.Temperature.severity]);
        this.drawLine(cod, cairo, 43, 533, 373, SEVERITY[data.Vaping.severity]);

        this.drawLine(cod, cairo, 620, 800, 247, SEVERITY[data['PM1.0'].severity]);
        this.drawLine(cod, cairo, 620, 800, 373, SEVERITY[data['PM2.5'].severity]);
        this.drawLine(cod, cairo, 850, 1030, 247, SEVERITY[data['PM4.0'].severity]);
        this.drawLine(cod, cairo, 850, 1030, 373, SEVERITY[data['PM10.0'].severity]);

        this.drawLine(cod, cairo, 1109, 1650, 120, SEVERITY[data.VOC.severity]);
        this.drawLine(cod, cairo, 1109, 1650, 247, SEVERITY[data.NOx.severity]);
        this.drawLine(cod, cairo, 1109, 1650, 373, SEVERITY[data.CO2.severity]);

        this.drawLine(cod, cairo, 40, 800, 540, SEVERITY[data.AQI.severity]);

        // Write texts
        void cod.cairo('cairo_set_font_face', cairo, this.fontBold);
        this.writeText(cod, cairo, data.Humidity.value, 260, POS.firstRow);
        this.writeText(cod, cairo, data.Temperature.value, 260, POS.secondRow);

        this.writeText(cod, cairo, data['PM1.0'].value, 600, POS.secondRow);
        this.writeText(cod, cairo, data['PM2.5'].value, 600, POS.thirdRow);
        this.writeText(cod, cairo, data['PM4.0'].value, 830, POS.secondRow);
        this.writeText(cod, cairo, data['PM10.0'].value, 830, POS.thirdRow);

        this.writeText(cod, cairo, data.VOC.value, 1380, POS.firstRow);
        this.writeText(cod, cairo, data.NOx.value, 1380, POS.secondRow);
        this.writeText(cod, cairo, data.CO2.value, 1380, POS.thirdRow);

        this.writeText(
            cod,
            cairo,
            data.AQI.value === 0 ? 'Calculating' : data.AQI.value.toString(),
            350,
            POS.fourthRow
        );

        void cod.cairo('cairo_set_font_face', cairo, this.fontRegular);

        this.writeText(cod, cairo, '%RH', 470, 50, 'small');
        this.writeText(cod, cairo, GRAM_UNIT, 940, 50, 'small');
        this.writeText(
            cod,
            cairo,
            data.Vaping.value === 0 ? 'UNDETECTED' : 'DETECTED',
            330,
            POS.thirdRow + 15,
            'small'
        );
        this.writeText(cod, cairo, unit, 470, 170, 'small');
        this.writeText(cod, cairo, 'ppm', 1450, POS.thirdRow + 10, 'small', true);

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

    private async uploadFont(fontName: string) {
        const imgData = fs.readFileSync(`fonts/${fontName}`);
        const fontRes = await this.cod.uploadFontData(imgData);
        return fontRes.var;
    }

    private async uploadImage(fileName: string) {
        const imgData = fs.readFileSync(fileName);
        const imgResponse = await this.cod.uploadImageData(imgData);
        return imgResponse.var;
    }

    private drawLine(
        cod: CamOverlayDrawingAPI,
        cairo: string,
        startPosX: number,
        endPosX: number,
        posY: number,
        color: number[]
    ) {
        const radius = 8 / 2;
        void cod.cairo('cairo_set_source_rgb', cairo, color[0], color[1], color[2]);

        void cod.cairo('cairo_arc', cairo, startPosX, posY, radius, 0, 2 * Math.PI);
        void cod.cairo('cairo_fill', cairo);

        void cod.cairo('cairo_arc', cairo, endPosX, posY, radius, 0, 2 * Math.PI);
        void cod.cairo('cairo_fill', cairo);

        void cod.cairo('cairo_set_line_width', cairo, 8);
        void cod.cairo('cairo_move_to', cairo, startPosX, posY);
        void cod.cairo('cairo_line_to', cairo, endPosX, posY);
        void cod.cairo('cairo_stroke', cairo);

        void cod.cairo('cairo_set_source_rgb', cairo, 1, 1, 1);
    }

    private writeText(
        cod: CamOverlayDrawingAPI,
        cairo: string,
        value: number | string,
        posX: number,
        posY: number,
        fontSize?: string,
        ppm?: boolean
    ) {
        void cod.writeText(
            cairo,
            value.toString(),
            posX,
            posY,
            200,
            fontSize === 'small' ? FONT.small : FONT.big,
            fontSize === 'small' ? (ppm ? 'A_RIGHT' : 'A_LEFT') : 'A_RIGHT',
            'TFM_SCALE'
        );
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
