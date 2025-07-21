import { CamOverlayDrawingAPI, TUploadImageResponse, TAlign } from 'camstreamerlib/CamOverlayDrawingAPI';

type RGB = [number, number, number];
type RGBA = [number, number, number, number];
type Options = {
    x: number;
    y: number;
    width: number;
    height: number;
    bg?: string;
    text?: string;
    fontColor?: RGB;
    bgColor?: RGBA;
};
type TMF = 'TFM_OVERFLOW' | 'TFM_SCALE' | 'TFM_TRUNCATE';
const white: RGB = [255, 255, 255];

export default class CairoFrame {
    protected posX: number;
    protected posY: number;
    protected width: number;
    protected height: number;
    protected children: CairoFrame[];
    private text: string;
    private font?: string;
    private fontColor: RGB;
    private bgColor?: RGBA;
    private fill: boolean;
    private bgImage?: string;
    private bgType: 'fit' | 'stretch' | 'plain';
    private textType: TMF;
    private align: TAlign;
    private bgWidth?: number;
    private bgHeight?: number;

    constructor(opt: Options) {
        this.posX = opt.x;
        this.posY = opt.y;
        this.width = opt.width;
        this.height = opt.height;

        this.bgImage = opt.bg;
        this.text = opt.text ?? '';
        this.fontColor = opt.fontColor ?? [1.0, 1.0, 1.0];
        this.bgColor = opt.bgColor; //RGBA

        this.children = [];
        this.fill = true;

        this.bgType = 'plain';
        this.textType = 'TFM_OVERFLOW';
        this.align = 'A_LEFT';
    }

    setText(text: string, align: TAlign, textType: TMF = 'TFM_OVERFLOW', color = white): void {
        this.text = text;
        this.fontColor = color;
        this.align = align;
        this.textType = textType;
    }

    insert(...frames: CairoFrame[]): void {
        this.children.push(...frames); //order of insertion is order of rendering
    }

    generateOwnImage(cod: CamOverlayDrawingAPI, cairo: string, ppX: number, ppY: number, scale: number): void {
        void cod.cairo('cairo_identity_matrix', cairo);
        if (this.font !== undefined) {
            void cod.cairo('cairo_set_font_face', cairo, this.font);
        }
        if (this.bgColor) {
            void cod.cairo(
                'cairo_set_source_rgba',
                cairo,
                this.bgColor[0],
                this.bgColor[1],
                this.bgColor[2],
                this.bgColor[3]
            );
            this.drawFrame(cod, cairo);
        }
        if (this.bgImage !== undefined) {
            void cod.cairo('cairo_translate', cairo, scale * ppX, scale * ppY);
            if (this.bgType === 'fit' && this.bgWidth !== undefined && this.bgHeight !== undefined) {
                const sx = this.width / this.bgWidth;
                const sy = this.height / this.bgHeight;
                void cod.cairo('cairo_scale', cairo, scale * sx, scale * sy);
            } else {
                void cod.cairo('cairo_scale', cairo, scale, scale);
            }
            void cod.cairo('cairo_set_source_surface', cairo, this.bgImage, 0, 0);
            void cod.cairo('cairo_paint', cairo);
        }
        if (this.text) {
            void cod.cairo('cairo_set_source_rgb', cairo, this.fontColor[0], this.fontColor[1], this.fontColor[2]);
            void cod.writeText(
                cairo,
                '' + this.text,
                Math.floor(scale * this.posX),
                Math.floor(scale * this.posY),
                Math.floor(scale * this.width),
                Math.floor(scale * this.height),
                this.align,
                this.textType
            );
        }
    }

    generateImage(cod: CamOverlayDrawingAPI, cairo: string, parentPos: [number, number], scale = 1): void {
        const ppX = parentPos[0];
        const ppY = parentPos[1];

        this.generateOwnImage(cod, cairo, this.posX + ppX, this.posY + ppY, scale);
        for (const child of this.children) {
            child.generateImage(cod, cairo, [this.posX + ppX, this.posY + ppY], scale);
        }
    }

    drawFrame(cod: CamOverlayDrawingAPI, cairo: string): void {
        const degrees = Math.PI / 180.0;
        const radius = 30.0;

        void cod.cairo('cairo_new_sub_path', cairo);
        void cod.cairo(
            'cairo_arc',
            cairo,
            this.posX + this.width - radius,
            this.posY + radius,
            radius,
            -90 * degrees,
            0 * degrees
        );
        void cod.cairo(
            'cairo_arc',
            cairo,
            this.posX + this.width - radius,
            this.posY + this.height - radius,
            radius,
            0 * degrees,
            90 * degrees
        );
        void cod.cairo(
            'cairo_arc',
            cairo,
            this.posX + radius,
            this.posY + this.height - radius,
            radius,
            90 * degrees,
            180 * degrees
        );
        void cod.cairo(
            'cairo_arc',
            cairo,
            this.posX + radius,
            this.posY + radius,
            radius,
            180 * degrees,
            270 * degrees
        );
        void cod.cairo('cairo_close_path', cairo);
        if (this.fill) {
            void cod.cairo('cairo_fill', cairo);
        }
        void cod.cairo('cairo_paint', cairo);
    }

    setFont(fontdata: string): void {
        this.font = fontdata;
    }

    setBgImage(imageData: TUploadImageResponse, type: 'fit' | 'stretch' | 'plain'): void {
        this.bgImage = imageData.var;
        this.bgWidth = imageData.width;
        this.bgHeight = imageData.height;
        if (type === 'stretch') {
            this.width = this.bgWidth;
            this.height = this.bgHeight;
        }
        this.bgType = type;
    }

    clear(): void {
        this.bgImage = undefined;
        this.bgWidth = 0;
        this.bgHeight = 0;
        this.text = '';
        this.fontColor = [1.0, 1.0, 1.0];
        this.align = 'A_LEFT';
    }
}
