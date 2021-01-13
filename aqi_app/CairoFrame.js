
class CairoFrame {
    constructor(posX, posY, width, height, bg, text, font_color, bg_color) {
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
        this.children = [];
        this.text = text || '';
        this.font = null;
        this.font_color = font_color || [1.0, 1.0, 1.0];
        this.bg_color = bg_color || null; //RGBA
        this.fill = true;

        this.bg_image = bg || null;
        this.bg_type = 'plain'; //fit/stretch/plain
        this.align = 'A_LEFT';
    }

    setText(text, align, color) {
        this.text = text;
        this.font_color = color;
        this.align = align;
    }

    insert(frame) {
        this.children.push(frame); //order of insertion is order of rendering
    }

    generateOwnImage(co, cairo, ppX, ppY, scale) {
        co.cairo('cairo_identity_matrix', cairo);
        if (this.font){
            co.cairo('cairo_set_font_face', cairo, this.font);
        }
        if (this.bg_color){
            co.cairo('cairo_set_source_rgba', cairo, this.bg_color[0], this.bg_color[1], this.bg_color[2], this.bg_color[3]);
            this.drawFrame(cairo,co);
        }
        if (this.bg_image) {
            if (this.bg_type == 'fit') {
                let sx = this.width / this.bg_width;
                let sy = this.height / this.bg_height;
                co.cairo('cairo_scale', cairo, scale*sx, scale*sy);
            }else {
                co.cairo('cairo_scale', cairo, scale, scale);
            }
            co.cairo('cairo_translate', cairo, ppX, ppY);
            co.cairo('cairo_set_source_surface', cairo, this.bg_image, 0, 0);
            co.cairo('cairo_paint', cairo);
        }
        if (this.text) {
            co.cairo('cairo_set_source_rgb', cairo, this.font_color[0], this.font_color[1], this.font_color[2]);
            co.writeText(cairo, ""+this.text, Math.floor(scale*this.posX),
                Math.floor(scale*this.posY), Math.floor(scale*this.width), Math.floor(scale*this.height), this.align);
        }
        return true;
    }

    generateImage(co, cairo, parentPos, scale) {
        let real_scale = scale||1;
        let ppX = parentPos[0];
        let ppY = parentPos[1];

        this.generateOwnImage(co, cairo, ppX, ppY,real_scale)
        for (let child of this.children) {
            child.generateImage(co, cairo, [this.posX + ppX, this.posY + ppY], real_scale);
        }
    }

    drawFrame(cairo, co){
        let degrees = Math.PI / 180.0;
        let radius = 30.0;
        cairo_close_path(cr);
        co.cairo('cairo_new_sub_path', cairo);
        co.cairo('cairo_arc', cairo, this.posX + this.width - radius, this.posY + radius, radius, -90 * degrees, 0 * degrees);
        co.cairo('cairo_arc', cairo, this.posX + this.width - radius, this.posY + this.height - radius, radius, 0 * degrees, 90 * degrees);
        co.cairo('cairo_arc', cairo, this.posX + radius, this.posY + this.height - radius, radius, 90 * degrees, 180 * degrees);
        co.cairo('cairo_arc', cairo, this.posX + radius, this.posY + radius, radius, 180 * degrees, 270 * degrees);
        co.cairo('cairo_close_path',cairo);
        if (this.fill){
            co.cairo('cairo_fill',cairo);
        }
        co.cairo('cairo_paint', cairo);
    }

    setFont(fontdata){
        this.font = fontdata;
    }

    setBgImage(image_data, type) {
        this.bg_image = image_data.var;
        this.bg_width = image_data.width;
        this.bg_height = image_data.height;
        if (type == "stretch"){
            this.width = this.bg_width;
            this.height = this.bg_height;
        }
        this.bg_type = type;
    }
}
module.exports = CairoFrame;