const { exception } = require('console');
const fs = require('fs');
const path = require('path');

class MemoryManager{

  constructor(co, img_path, font_path){
    this.fonts = {};
    this.images = {};
    this.img_files = {};
    this.fonts = {};
    this.font_files = {};
    this.co = co;
    this.img_path = img_path;
    this.font_path = font_path;
  }

  async image(moniker){
    if (moniker in this.images){
      return this.images[moniker];
    }else if(moniker in this.img_files){
      var imgData = fs.readFileSync(this.img_files[moniker]);
      const promise = await this.co.uploadImageData(imgData, path.extname(this.img_files[moniker]));
      this.images[moniker] = promise;
      return promise;
    }else{
      throw exception("Error! Unknown image requested!");
    }
  }

  async font(moniker){
    if (moniker in this.fonts){
      return this.fonts[moniker];
    }else if (moniker in this.font_files){
      const f = await loadTTF(this.co, this.font_files[moniker]);
      this.fonts[moniker] = f;
      return f;
    }else{
      throw exception("Error! Unknown font requested!");
    }
  }

  registerImage(moniker, fileName){
    this.img_files[moniker] = this.img_path + "/" + fileName;
  }

  registerFont(moniker, fileName){
    this.font_files[moniker] = this.font_path + "/" + fileName;
  }
}


function loadTTF (co, fileName) {
  var promise = new Promise(function(resolve, reject) {
  var imgData = fs.readFileSync(fileName);
      co.uploadFontData(imgData).then(function(fontRes) {
          resolve(fontRes.var);
      });
  });
  return promise;
}

  module.exports = MemoryManager;