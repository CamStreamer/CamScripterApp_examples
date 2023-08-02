const { exception } = require('console');
const fs = require('fs');

class MemoryManager{

  constructor(co){
    this.fonts = {};
    this.images = {};
    this.img_files = {};
    this.fonts = {};
    this.font_files = {};
    this.co = co;
  }

  async image(moniker){
    if (moniker in this.images){
      return this.images[moniker];
    }else if(moniker in this.img_files){
      var imgData = fs.readFileSync(this.img_files[moniker]);
      const promise = await this.co.uploadImageData(imgData);
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
    //TODO: control that the file exists!
    this.img_files[moniker] = process.env.INSTALL_PATH  + "/images/" + fileName;
  }

  registerFont(moniker, fileName){
    this.font_files[moniker] = process.env.INSTALL_PATH  + "/fonts/" + fileName;
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