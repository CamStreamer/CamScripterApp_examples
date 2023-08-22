import type { CamOverlayDrawingAPI, UploadImageResponse, Align } from 'camstreamerlib/CamOverlayDrawingAPI';

type RGB = [number, number, number];
type RGBA = [number, number, number, number];
type Options = {
    x: number;
    y: number;
    width?: number;
    height?: number;
    bg?: string;
    text?: string;
    font_color?: RGB;
    bg_color?: RGBA;
};

const white: RGB = [255, 255, 255];

export default class CairoFrame {
    protected posX: number;
    protected posY: number;
    protected width: number;
    protected height: number;
    protected children: CairoFrame[];
    private text: string;
    private font: string;
    private font_color: RGB;
    private bg_color: RGBA;
    private fill: boolean;
    private bg_image: string;
    private bg_type: 'fit' | 'stretch' | 'plain';
    private align: Align;
    private bg_width: number = null;
    private bg_height: number = null;

    constructor(opt: Options) {
        this.posX = opt.x;
        this.posY = opt.y;
        this.width = opt.width;
        this.height = opt.height;

        this.bg_image = opt.bg ?? null;
        this.text = opt.text ?? '';
        this.font_color = opt.font_color ?? [1.0, 1.0, 1.0];
        this.bg_color = opt.bg_color ?? null; //RGBA

        this.children = [];
        this.font = null;
        this.fill = true;

        this.bg_type = 'plain';
        this.align = 'A_LEFT';
    }

    setText(text: string, align: Align, color = white): void {
        this.text = text;
        this.font_color = color;
        this.align = align;
    }

    insert(...frames: CairoFrame[]): void {
        this.children.push(...frames); //order of insertion is order of rendering
    }
    insertAll(frames: Record<string, CairoFrame>): void {
        for (const name in frames) {
            this.insert(frames[name]);
        }
    }

    generateOwnImage(co: CamOverlayDrawingAPI, cairo: string, ppX: number, ppY: number, scale: number): void {
        co.cairo('cairo_identity_matrix', cairo);
        if (this.font) {
            co.cairo('cairo_set_font_face', cairo, this.font);
        }
        if (this.bg_color) {
            co.cairo(
                'cairo_set_source_rgba',
                cairo,
                this.bg_color[0],
                this.bg_color[1],
                this.bg_color[2],
                this.bg_color[3]
            );
            this.drawFrame(co, cairo);
        }
        if (this.bg_image) {
            if (this.bg_type == 'fit') {
                const sx = this.width / this.bg_width;
                const sy = this.height / this.bg_height;
                co.cairo('cairo_scale', cairo, scale * sx, scale * sy);
            } else {
                co.cairo('cairo_scale', cairo, scale, scale);
            }
            co.cairo('cairo_translate', cairo, ppX, ppY);
            co.cairo('cairo_set_source_surface', cairo, this.bg_image, 0, 0);
            co.cairo('cairo_paint', cairo);
        }
        if (this.text) {
            co.cairo('cairo_set_source_rgb', cairo, this.font_color[0], this.font_color[1], this.font_color[2]);
            co.writeText(
                cairo,
                '' + this.text,
                Math.floor(scale * this.posX),
                Math.floor(scale * this.posY),
                Math.floor(scale * this.width),
                Math.floor(scale * this.height),
                this.align,
                'TFM_OVERFLOW'
            );
        }
    }

    generateImage(co: CamOverlayDrawingAPI, cairo: string, parentPos: [number, number], scale = 1): void {
        const ppX = parentPos[0];
        const ppY = parentPos[1];

        this.generateOwnImage(co, cairo, this.posX + ppX, this.posY + ppY, scale);
        for (const child of this.children) {
            child.generateImage(co, cairo, [this.posX + ppX, this.posY + ppY], scale);
        }
    }

    drawFrame(co: CamOverlayDrawingAPI, cairo: string): void {
        const degrees = Math.PI / 180.0;
        const radius = 30.0;

        co.cairo('cairo_new_sub_path', cairo);
        co.cairo(
            'cairo_arc',
            cairo,
            this.posX + this.width - radius,
            this.posY + radius,
            radius,
            -90 * degrees,
            0 * degrees
        );
        co.cairo(
            'cairo_arc',
            cairo,
            this.posX + this.width - radius,
            this.posY + this.height - radius,
            radius,
            0 * degrees,
            90 * degrees
        );
        co.cairo(
            'cairo_arc',
            cairo,
            this.posX + radius,
            this.posY + this.height - radius,
            radius,
            90 * degrees,
            180 * degrees
        );
        co.cairo('cairo_arc', cairo, this.posX + radius, this.posY + radius, radius, 180 * degrees, 270 * degrees);
        co.cairo('cairo_close_path', cairo);
        if (this.fill) {
            co.cairo('cairo_fill', cairo);
        }
        co.cairo('cairo_paint', cairo);
    }

    setFont(fontdata: string): void {
        this.font = fontdata;
    }

    setBgImage(image_data: UploadImageResponse, type: 'fit' | 'stretch' | 'plain'): void {
        this.bg_image = image_data.var;
        this.bg_width = image_data.width;
        this.bg_height = image_data.height;
        if (type == 'stretch') {
            this.width = this.bg_width;
            this.height = this.bg_height;
        }
        this.bg_type = type;
    }

    removeImage(): void {
        this.bg_image = null;
        this.bg_width = 0;
        this.bg_height = 0;
    }
}
