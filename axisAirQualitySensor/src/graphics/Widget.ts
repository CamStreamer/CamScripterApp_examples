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
    private font: string | undefined;
    private background: string | undefined;

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
            if (this.font === undefined) {
                this.font = await this.uploadFont();
            }
            if (this.background === undefined) {
                this.background = await this.uploadImage();
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

        // Draw the background
        if (this.background) {
            await cod.cairo('cairo_set_source_surface', cairo, this.background, 0, 0);
            await cod.cairo('cairo_paint', cairo);
        }

        void cod.cairo('cairo_set_font_face', cairo, this.font);
        void cod.cairo('cairo_set_font_size', cairo, 48);

        // Draw severity lines
        this.drawLine(cod, cairo, 40, 550, 120, SEVERITY[data.Humidity.severity]);
        this.drawLine(cod, cairo, 40, 550, 250, SEVERITY[data.Temperature.severity]);
        this.drawLine(cod, cairo, 40, 550, 370, SEVERITY[data.Vaping.severity]);

        this.drawLine(cod, cairo, 620, 800, 250, SEVERITY[data['PM1.0'].severity]);
        this.drawLine(cod, cairo, 620, 800, 370, SEVERITY[data['PM2.5'].severity]);
        this.drawLine(cod, cairo, 850, 1030, 250, SEVERITY[data['PM4.0'].severity]);
        this.drawLine(cod, cairo, 850, 1030, 370, SEVERITY[data['PM10.0'].severity]);

        this.drawLine(cod, cairo, 1100, 1650, 120, SEVERITY[data.VOC.severity]);
        this.drawLine(cod, cairo, 1100, 1650, 250, SEVERITY[data.NOx.severity]);
        this.drawLine(cod, cairo, 1100, 1650, 370, SEVERITY[data.CO2.severity]);

        this.drawLine(cod, cairo, 40, 800, 540, SEVERITY[data.AQI.severity]);

        // Write texts
        this.writeText(cod, cairo, data.Humidity.value, POS.leftColumn, POS.firstRow);
        this.writeText(cod, cairo, '%RH', POS.leftColumn + 100, 50, 'small');
        this.writeText(cod, cairo, GRAM_UNIT, POS.centerRightColumn, 50, 'small');
        this.writeText(cod, cairo, data.Temperature.value, POS.leftColumn, POS.secondRow);
        this.writeText(
            cod,
            cairo,
            data.Vaping.value === 0 ? 'UNDETECTED' : 'DETECTED',
            POS.leftColumn + 10,
            POS.thirdRow + 15,
            'small'
        );
        this.writeText(cod, cairo, unit, POS.leftColumn + 100, 170, 'small');

        this.writeText(cod, cairo, data['PM1.0'].value, POS.centerLeftColumn, POS.secondRow);
        this.writeText(cod, cairo, data['PM2.5'].value, POS.centerLeftColumn, POS.thirdRow);
        this.writeText(cod, cairo, data['PM4.0'].value, POS.centerRightColumn, POS.secondRow);
        this.writeText(cod, cairo, data['PM10.0'].value, POS.centerRightColumn, POS.thirdRow);

        this.writeText(cod, cairo, data.VOC.value, POS.rightColumn, POS.firstRow);
        this.writeText(cod, cairo, data.NOx.value, POS.rightColumn, POS.secondRow);
        this.writeText(cod, cairo, data.CO2.value, POS.rightColumn, POS.thirdRow);
        this.writeText(cod, cairo, 'ppm', POS.rightColumn + 100, POS.thirdRow + 10, 'small');

        this.writeText(
            cod,
            cairo,
            data.AQI.value === 0 ? 'Calculating' : data.AQI.value.toString(),
            POS.leftColumn + 50,
            POS.fourthRow
        );

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

    private async uploadFont() {
        const imgData = fs.readFileSync('fonts/OpenSans-Regular.ttf');
        const fontRes = await this.cod.uploadFontData(imgData);
        return fontRes.var;
    }

    private async uploadImage() {
        const imgData = fs.readFileSync('background/axis-air-quality-widget.png');
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
        void cod.cairo('cairo_set_source_rgb', cairo, color[0], color[1], color[2]);
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
        fontSize?: string
    ) {
        void cod.writeText(
            cairo,
            value.toString(),
            posX,
            posY,
            200, // width of the text box?
            fontSize === 'small' ? FONT.small : FONT.big,
            'A_CENTER',
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
