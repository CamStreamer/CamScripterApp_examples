const CairoFrame = require('./CairoFrame');

const COORD = {
    top_left: [-1, -1],
    center_left: [-1, 0],
    bottom_left: [-1, 1],
    top_center: [0, -1],
    center: [0, 0],
    bottom_center: [0, 1],
    top_right: [1, -1],
    center_right: [1, 0],
    bottom_right: [1, -1]
};

class CairoPainter extends CairoFrame {
    constructor(res_w, res_h, co_ord, posX, posY, width, height, bg, text, font_color) {
        super(posX, posY, width, height, bg, text, font_color);
        this.co_ord = COORD[co_ord];
        this.screen_width = res_w;
        this.screen_height = res_h;
    }

    async generateImage(co, scale) {
        let real_scale = scale || 1;
        let access = await this._begin(co, scale);
        this.surface = access[0];
        this.cairo = access[1];
        this.generateOwnImage(co, this.cairo, 0, 0, real_scale);
        for (let child of this.children) {
            child.generateImage(co, this.cairo, [0, 0], real_scale);
        }
        co.showCairoImage(this.surface, this._convertor(this.co_ord[0], this.screen_width, this.posX, scale * this.width),
            this._convertor(this.co_ord[1], this.screen_height, this.posY, scale * this.height));
        this._destroy(co);
    }
    _convertor(b, v, d, corr) {
        let c = b >= 0 ? -1 : 1; //směr posuvu
        let d2 = b >= 0 ? corr + d : d; //posuv
        return b + c * d2 * (2.0 / v)

    }
    async _begin(co, scale) {
        const surface = await co.cairo('cairo_image_surface_create', 'CAIRO_FORMAT_ARGB32', Math.floor(this.width * scale), Math.floor(this.height * scale));
        const cairo = await co.cairo('cairo_create', surface.var);

        return [surface.var, cairo.var];
    }
    async _destroy(co) {
        co.cairo('cairo_surface_destroy', this.surface);
        co.cairo('cairo_destroy', this.cairo);

    }
}

module.exports = CairoPainter;