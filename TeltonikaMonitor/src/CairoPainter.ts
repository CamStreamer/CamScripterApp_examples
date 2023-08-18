import type { CamOverlayDrawingAPI, CairoCreateResponse } from 'camstreamerlib/CamOverlayDrawingAPI';

import CairoFrame from './CairoFrame';

const COORD: Record<string, [number, number]> = {
    top_left: [-1, -1],
    center_left: [-1, 0],
    bottom_left: [-1, 1],
    top_center: [0, -1],
    center: [0, 0],
    bottom_center: [0, 1],
    top_right: [1, -1],
    center_right: [1, 0],
    bottom_right: [1, 1],
};

type Options = {
    x: number;
    y: number;
    width: number;
    height: number;
    screen_width: number;
    screen_height: number;
    co_ord: string;
};

export default class CairoPainter extends CairoFrame {
    private screen_width: number;
    private screen_height: number;
    private co_ord: [number, number];
    private surface: string = null;
    private cairo: string = null;

    constructor(opt: Options) {
        super(opt);
        this.co_ord = COORD[opt.co_ord];
        this.screen_width = opt.screen_width;
        this.screen_height = opt.screen_height;
    }

    async generate(co: CamOverlayDrawingAPI, scale = 1) {
        const access = await this.begin(co, scale);
        this.surface = access[0];
        this.cairo = access[1];
        this.generateOwnImage(co, this.cairo, 0, 0, scale);
        for (const child of this.children) {
            child.generateImage(co, this.cairo, [0, 0], scale);
        }
        co.showCairoImage(
            this.surface,
            this.convertor(this.co_ord[0], this.screen_width, this.posX, scale * this.width),
            this.convertor(this.co_ord[1], this.screen_height, this.posY, scale * this.height)
        );
        this.destroy(co);
    }
    private convertor(alignment: number, screen_size: number, position: number, graphics_size: number): number {
        switch (alignment) {
            case -1:
                return alignment + (2.0 * position) / screen_size;
            case 0:
                return alignment - (2.0 * (position + graphics_size / 2)) / screen_size;
            case 1:
                return alignment - (2.0 * (position + graphics_size)) / screen_size;
            default:
                throw new Error('Invalid graphics alignment.');
        }
    }
    private async begin(co: CamOverlayDrawingAPI, scale: number) {
        const surface = (await co.cairo(
            'cairo_image_surface_create',
            'CAIRO_FORMAT_ARGB32',
            Math.floor(this.width * scale),
            Math.floor(this.height * scale)
        )) as CairoCreateResponse;
        const cairo = (await co.cairo('cairo_create', surface.var)) as CairoCreateResponse;

        return [surface.var, cairo.var];
    }
    private async destroy(co: CamOverlayDrawingAPI) {
        co.cairo('cairo_surface_destroy', this.surface);
        co.cairo('cairo_destroy', this.cairo);
    }
}
