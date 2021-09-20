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
        this.rotation = 0;
        this.bg_image = bg || null;
        this.bg_type = 'plain'; //fit/stretch/plain
        this.align = 'A_LEFT';
        this.enable = true;
        this.draw_border = false;
        this.border = 0;
        this.border_color = null;
        this.padding = [0,0,0,0]; //clockwise
    }

    setText(text, align, color) {
        this.text = text;
        this.font_color = color ? color : this.font_color;
        this.align = align ? align: this.align;
    }

    setPadding(){
        if (arguments.length < 1){
            return;
        }else if (Array.isArray(arguments[0])){
            this.padding = arguments[0];
        }else {
            for (let i = 0; (i < arguments.length) && (i < 4); i++){
                this.padding[i] = arguments[i];
            }
        }
    }

    setBorder(color,width){
        this.border = width ? width : this.border;
        this.border_color = color;
    }
    insert(frame) {
        this.children.push(frame); //order of insertion is order of rendering
    }

    rotate(angle){ //radians
        this.rotation = angle;
    }

    _doInplaceRotation(co, cairo,  rotation){ //TODO: fitování do rámečku při obecném úhlu otočení
        co.cairo('cairo_translate', cairo, Math.floor(this.width/2), Math.floor(this.height/2));
        co.cairo('cairo_rotate',cairo, rotation);
        co.cairo('cairo_translate', cairo, -Math.floor(this.width/2), -Math.floor(this.height/2));
    }

    generateOwnImage(co, cairo, ppX, ppY, scale) {

        co.cairo('cairo_identity_matrix', cairo);
        if (this.font){
            co.cairo('cairo_set_font_face', cairo, this.font);
        }
        if (this.bg_color){
            co.cairo('cairo_scale', cairo, scale, scale);
            this.drawFrame(cairo, co, scale*(ppX+this.posX), scale*(ppY+this.posY), scale, this.fill, this.bg_color);
        }
        if (this.bg_image) {
            this._doInplaceRotation(co, cairo, this.rotation);
            co.cairo('cairo_translate', cairo, scale*(ppX + this.posX), scale*(ppY + this.posY));
            if (this.bg_type == 'fit') {
                let sx = this.width / this.bg_width;
                let sy = this.height / this.bg_height;
                co.cairo('cairo_scale', cairo, scale*sx, scale*sy);
            }else {
                co.cairo('cairo_scale', cairo, scale, scale);
            }
            co.cairo('cairo_set_source_surface', cairo, this.bg_image, 0, 0);
            co.cairo('cairo_paint', cairo);
        }
        if (this.border_color){
            co.cairo('cairo_scale', cairo, scale, scale);
            this.drawFrame(cairo, co, scale*(ppX+this.posX), scale*(ppY+this.posY), scale, false, this.border_color);
        }
        if (this.text) {
            co.cairo('cairo_set_source_rgb', cairo, this.font_color[0], this.font_color[1], this.font_color[2]);
            co.writeText(cairo, ""+this.text, Math.floor(scale*(ppX + this.posX + this.padding[3]+this.border)),
                Math.floor(scale*(ppY + this.posY + this.padding[0] + this.border)),
                Math.floor(scale*(this.width - this.border -(this.padding[1] + this.padding[3]))),
                Math.floor(scale*(this.height - this.border - (this.padding[2] + this.padding[0]))), this.align);
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

    drawFrame(cairo, co, x,y, scale, fill, color){
        let degrees = Math.PI / 180.0;
        let radius = scale*10.0;
        if (color.length < 4){
            co.cairo('cairo_set_source_rgb', cairo, color[0], color[1], color[2]);
        }else{
            co.cairo('cairo_set_source_rgba', cairo, color[0], color[1], color[2], color[3]);
        }
        co.cairo('cairo_new_sub_path', cairo);
        co.cairo('cairo_arc', cairo, x + this.width - radius + this.border, y + radius - this.border, radius, -90 * degrees, 0 * degrees);
        co.cairo('cairo_arc', cairo, x + this.width - radius + this.border,  y + this.height + this.border - radius, radius, 0 * degrees, 90 * degrees);
        co.cairo('cairo_arc', cairo, x + radius - this.border, y + this.height + this.border - radius, radius, 90 * degrees, 180 * degrees);
        co.cairo('cairo_arc', cairo, x + radius - this.border, y + radius - this.border, radius, 180 * degrees, 270 * degrees);
        co.cairo('cairo_close_path', cairo);
        if (fill){
            co.cairo('cairo_fill',cairo);

        }else{
            co.cairo('cairo_set_line_width',cairo, this.border);
            co.cairo('cairo_stroke',cairo);
        }
    }

    setFont(fontdata){
        this.font = fontdata;
    }

    setBackground(color){
        this.bg_color = color;
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