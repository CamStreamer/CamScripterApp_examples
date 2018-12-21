const fs = require('fs');
const url = require('url');
const querystring = require('querystring');
const formidable = require('formidable');
const HttpServer = require('./CamStreamerLib/HttpServer');
const CameraVapix = require('./CamStreamerLib/CameraVapix');
const CamOverlayAPI = require('./CamStreamerLib/CamOverlayAPI');

var settings = {};
var cv = null;
var credentials = {}; // Find credential by cardId
var users = {}        // Find user by token
var co = null;
var coConnected = false;
var bgImage = null;
var nophotoImage = null;
var baseFont = null;
var imageClearTimer = null;

var httpServer = new HttpServer();
httpServer.onRequest('/get_credentials.cgi', function(req, res) {
  readCredentialList().then(function() {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(credentials));
  }, function() {
    res.statusCode = 500;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('{"message": "Controller connection error"}');
  });
});

httpServer.onRequest('/get_users.cgi', function(req, res) {
  readUserList().then(function() {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(users));
  }, function() {
    res.statusCode = 500;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('{"message": "Controller connection error"}');
  });
});

httpServer.onRequest('/upload_image.cgi', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if ('POST' == req.method) {
    // Parse form data
    var form = new formidable.IncomingForm();
    var image = null;
    form.onPart = function(part) {
      if (part.name != "uploadedImage") {
        form.handlePart(part);
      } else { // extra handle for image post data
        part.on('data', function(data) {
          if (image) {
            image = Buffer.concat([image, data]);
          } else {
            image = new Buffer(data);
          }
        });
        part.on('error', function(err) {
          image = null;
        });
      }
    }
    form.parse(req, function(err, fields, files) {
      if (err) {
        res.statusCode = 500;
        res.end('{"message": "Post data parser error:' + err + '"}');
      } else if (!image || image.length == 0) {
        res.statusCode = 400;
        res.end('{"message": "Image empty"}');
      } else {
        try {
          fs.writeFileSync(process.env.PERSISTENT_DATA_PATH + fields.userToken, image);
          res.statusCode = 200;
          res.end('{"message": "OK"}');
        } catch (err) {
          console.log(err);
          res.statusCode = 500;
          res.end('{"message": "Write image error"}');
        }
      }
    });
  } else { // unknown http method
    res.statusCode = 400;
    res.end('{"message": "Unknown http method:' + req.method + '"}');
  }
});

httpServer.onRequest('/delete_image.cgi', function(req, res) {
  const parsedUrl = url.parse(req.url);
  var params = querystring.parse(parsedUrl.query)
  fs.unlink(process.env.PERSISTENT_DATA_PATH + params.userToken);

  res.statusCode = 200;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end();
});

httpServer.onRequest('/image.cgi', function(req, res) {
  try {
    const parsedUrl = url.parse(req.url);
    var params = querystring.parse(parsedUrl.query)
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/*');
    res.end(fs.readFileSync(process.env.PERSISTENT_DATA_PATH + params.userToken));
  } catch (err) {
    console.log(err);
    res.statusCode = 500;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end();
  }
});

httpServer.on('error', function(err) {
  console.log(err);
});

httpServer.on('access', function(msg) {
  console.log(msg);
});

function readSettings() {
  try {
    var data = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
    if (data.length) {
      settings = JSON.parse(data);
    }
  } catch (err) {
    console.log('Settings file not found. Please configure this application in it\'s user interface.');
    process.exit(1);
  }
}

function readCredentialList() {
  var promise = new Promise(function(resolve, reject) {
    credentials = {};
    cv.vapixPost('/vapix/pacs', '{"pacsaxis:GetCredentialList":{}}').then(function(response) {
      try {
        //console.log(response);
        response = JSON.parse(response);
        for (var i = 0; i < response.Credential.length; i++) {
          var credential = response.Credential[i];
          for (var j = 0; j < credential.IdData.length; j++) {
            if (credential.IdData[j].Name == 'Card') {
              var cardId = credential.IdData[j].Value;
              credentials[cardId] = credential.UserToken;
              break;
            }
          }
        }
        //console.log(credentials);
        resolve();
      } catch (err) {
        console.log(err);
        reject();
      }
    }, function(err) {
      console.log(err);
      reject();
    });
  }.bind(this));
  return promise;
}

function readUserList() {
  var promise = new Promise(function(resolve, reject) {
    users = {};
    cv.vapixPost('/vapix/pacs', '{"axudb:GetUserInfoList":{}}').then(function(response) {
      try {
        //console.log(response);
        response = JSON.parse(response);
        for (var i = 0; i < response.UserInfo.length; i++) {
          var userInfo = response.UserInfo[i];
          users[userInfo.token] = {'name': userInfo.Name, 'description': userInfo.Description};
        }
        //console.log(users);
        resolve();
      } catch (err) {
        console.log(err);
        reject();
      }
    }, function(err) {
      console.log(err);
      reject();
    });
  }.bind(this));
  return promise;
}

function subscribeEvents() {
  cv.on('eventsConnect', function() { console.log('Events connected') });
  cv.on('eventsDisconnect', function(err) { console.log('Events disconnected: ' + err) });

  cv.on('tns1:IdPoint/tnsaxis:Request/IdData/.', function(event) {
    var cardId = parseAccessEvent(event, 'Card');
    if (!credentials.hasOwnProperty(cardId)) {
      drawImage(null, false);
    }
  });
  cv.on('tns1:AccessControl/AccessGranted/Credential/.', function(event) {
    //console.log(JSON.stringify(event));
    var userToken = parseAccessEvent(event, 'CredentialHolderName');
    drawImage(userToken, true);
  });
  cv.on('tns1:AccessControl/Denied/Credential/.', function(event) {
    //console.log(JSON.stringify(event));
    var userToken = parseAccessEvent(event, 'CredentialHolderName');
    drawImage(userToken, false);
  });

  cv.eventsConnect();
}

function parseAccessEvent(event, valueName) {
  try {
    var simpleItem = event['tt:MetadataStream']['tt:Event']
      [0]['wsnt:NotificationMessage']
        [0]['wsnt:Message']
          [0]['tt:Message']
            [0]['tt:Data']
              [0]['tt:SimpleItem'];
    for (var i = 0; i < simpleItem.length; i++) {
      if (simpleItem[i]['$'].Name == valueName) {
        //console.log(simpleItem[i]['$']);
        return simpleItem[i]['$'].Value;
      }
    }
  } catch (err) {
    console.log('Invalid event data: ' + err);
  }
  return null;
}

function drawImage(userToken, accessGranted) {
  console.log(userToken + ' - access granted: ' + accessGranted);
  if (!coConnected) {
    return;
  }

  var userName = ',Unknown';
  var imageName = '';
  if (userToken && users[userToken] != undefined) {
    userName = users[userToken].name;
    imageName = userToken;
  }

  co.cairo('cairo_image_surface_create', 'CAIRO_FORMAT_ARGB32', Math.floor(464 * settings.scale), Math.floor(313 * settings.scale)).then(function(surfaceRes) {
    var surface = surfaceRes.var;
    co.cairo('cairo_create', surface).then(function(cairoRes) {
      var cairo = cairoRes.var;

      co.cairo('cairo_scale', cairo, settings.scale, settings.scale);

      // Draw background
      co.cairo('cairo_set_source_surface', cairo, bgImage.var, 0, 0);
      co.cairo('cairo_paint', cairo);

      // Draw date and time
      var d = new Date();
      var dateText = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + " " + d.getHours() + ':' + d.getMinutes();
      co.cairo('cairo_set_font_face', cairo, baseFont.var);
      co.cairo('cairo_set_source_rgb', cairo, 1.0, 1.0, 1.0);
      co.writeText(cairo, dateText, 25, 20, 230, 28, 'A_LEFT');

      // Draw user name
      var userNameArr = userName.split(',');
      var firstname = userNameArr.length > 1 ? userNameArr[1].trim() : '';
      var lastname = userNameArr[0].trim();
      co.writeText(cairo, firstname, 25, 100, 230, 34, 'A_LEFT');
      co.writeText(cairo, lastname, 25, 140, 230, 34, 'A_LEFT');

      // Draw access granted
      if (accessGranted) {
        drawRoundedRectangle(cairo, 25, 217, 230, 65, 10);
        co.cairo('cairo_set_source_rgb', cairo, 0, 0.7, 0);
        co.cairo('cairo_fill', cairo);
        co.cairo('cairo_set_source_rgb', cairo, 1.0, 1.0, 1.0);
        co.writeText(cairo, 'Access granted', 25, 233, 230, 25, 'A_CENTER');
      } else {
        drawRoundedRectangle(cairo, 25, 217, 230, 65, 10);
        co.cairo('cairo_set_source_rgb', cairo, 0.8, 0, 0);
        co.cairo('cairo_fill', cairo);
        co.cairo('cairo_set_source_rgb', cairo, 1.0, 1.0, 1.0);
        co.writeText(cairo, 'Access denied', 25, 233, 230, 25, 'A_CENTER');
      }

      // Draw user image
      loadImage(process.env.PERSISTENT_DATA_PATH + imageName).then(function(userImage) {
        var avatar = nophotoImage;
        if (userImage) {
          avatar = userImage;
        }

        var scaleX = 144 / avatar.width;
        var scaleY = 182 / avatar.height;
        var imgScale = Math.min(scaleX, scaleY);
        co.cairo('cairo_translate', cairo, 290, 100);
        co.cairo('cairo_scale', cairo, imgScale, imgScale);
        co.cairo('cairo_set_source_surface', cairo, avatar.var, 0, 0);
        co.cairo('cairo_paint', cairo);
        if (userImage) {
          co.cairo('cairo_surface_destroy', userImage.var);
        }

        co.showCairoImageAbsolute(surface, settings.pos_x, settings.pos_y, settings.width, settings.height);
        clearTimeout(imageClearTimer);
        imageClearTimer = setTimeout(function() {
          co.removeImage();
        }, 5000);

        // Cleanup
        co.cairo('cairo_surface_destroy', surface);
        co.cairo('cairo_destroy', cairo);
      });
    });
  });
}

function loadFont(fileName) {
  var promise = new Promise(function(resolve, reject) {
    fs.readFile(fileName, function(err, data) {
      if (err) {
        resolve(null);
        return;
      }
      co.uploadFontData(data).then(function(fontRes) {
        font = fontRes;
        resolve(font);
      });
    });
  });
  return promise;
}

function loadImage(fileName) {
  var promise = new Promise(function(resolve, reject) {
    fs.readFile(fileName, function(err, imgData) {
      if (err) {
        resolve(null);
        return;
      }
      co.uploadImageData(imgData).then(function(imgSurfaceRes) {
        resolve(imgSurfaceRes);
      });
    });
  });
  return promise;
}

function drawRoundedRectangle(cairo, x, y, width, height, radius) {
  const degrees = Math.PI / 180.0;
  co.cairo('cairo_new_sub_path', cairo);
  co.cairo('cairo_arc', cairo, x + width - radius, y + radius, radius, -90 * degrees, 0 * degrees);
  co.cairo('cairo_arc', cairo, x + width - radius, y + height - radius, radius, 0 * degrees, 90 * degrees);
  co.cairo('cairo_arc', cairo, x + radius, y + height - radius, radius, 90 * degrees, 180 * degrees);
  co.cairo('cairo_arc', cairo, x + radius, y + radius, radius, 180 * degrees, 270 * degrees);
  co.cairo('cairo_close_path', cairo);
}

readSettings();

cv = new CameraVapix({
  'protocol': 'http',
  'ip': settings.controller_host,
  'port': settings.controller_port,
  'auth': settings.controller_user + ':' + settings.controller_pass,
});

readCredentialList().then(function() {}, function() {
  process.exit(1);
});
readUserList().then(function() {}, function() {
  process.exit(1);
});
subscribeEvents();

co = new CamOverlayAPI({
  'ip': '127.0.0.1',
  'port': 80,
  //'port': 52431,
  'auth': settings.camera_user + ':' + settings.camera_pass,
  'serviceName': 'Door Controller',
  'serviceID': -1,
});

co.on('msg', function(msg) {
  //console.log('COAPI-Message: ' + msg);
});

co.on('error', function(err) {
  console.log('COAPI-Error: ' + err);
});

co.on('close', function() {
  console.log('COAPI-Error: connection closed');
  process.exit(1);
});

co.connect().then(function() {
  console.log('COAPI connected');
  co.removeImage();

  loadImage('bg.png').then(function(bgImg) {
    bgImage = bgImg;
    loadImage('nophoto.png').then(function(img) {
      nophotoImage = img;
      loadFont('FreeSans.ttf').then(function(font) {
        baseFont = font
        coConnected = true;
        //drawImage('8c88a8b3', false);
      });
    });
  });
}, function (err) {
  console.log(err);
  console.log('COAPI-Error: connection error');
});
