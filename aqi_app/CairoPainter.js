const CairoFrame = require('./CairoFrame');
class CairoPainter extends CairoFrame{
    constructor( posX, posY, width, height, bg, text, font_color){
        super(posX, posY, width, height, bg, text, font_color);
    }

    async loadFont(){
        if (!this.font) {
            this.font = await this.loadTTF('fonts/arial_b.ttf');
        }
    }
    loadTTF (fileName) {
        var promise = new Promise(function(resolve, reject) {
        var imgData = fs.readFileSync(fileName);
            co.uploadFontData(imgData).then(function(fontRes) {
                resolve(fontRes.var);
            });
        });
        return promise;
    }
    async generateImage (co,scale){
        let real_scale = scale || 1;
        let access = await this._begin(co);
        this.surface = access[0];
        this.cairo = access[1];
        this.generateOwnImage(co,this.cairo,0,0,real_scale);
        for (let child of this.children){
            child.generateImage(co,this.cairo, [0,0],real_scale);
        }
        co.showCairoImage(this.surface, this.posX, this.posY, scale*this.width, scale*this.height);
        this._destroy(co);
    }
    async _begin(co){
        const surface = await co.cairo('cairo_image_surface_create', 'CAIRO_FORMAT_ARGB32', Math.floor(this.width), Math.floor(this.height));
        const cairo = await co.cairo('cairo_create', surface.var);

        return [surface.var,cairo.var];
    }
    async _destroy(co){
        await co.cairo('cairo_surface_destroy', this.surface);
        await co.cairo('cairo_destroy', this.cairo);

    }
}

module.exports = CairoPainter;