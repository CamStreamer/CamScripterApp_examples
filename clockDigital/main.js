const fs = require('fs');  // see https://nodejs.org/api/fs.html
const CamOverlayAPI = require('./CamStreamerLib/CamOverlayAPI'); // load the library

// Main function
function clockRun() {
  // Create CamOverlayAPI object
  var co = new CamOverlayAPI({
    'ip': '127.0.0.1', // use 127.0.0.1 because CamOverlay is running on the same camera as CamScripter
    'port': 80,        // http port - mind that the camera could use different port
    'auth': 'root:pass',  // please change the username / password to access http interface of the camera (sure there should be some configuration parameter in production version)
    'serviceName': 'Digital Clock', // use some unique name, new CamOverlay service will be created (is visible in CamOverlay UI)
    'camera': 0 // destination video channel (default is 0)
  });

  // Listen for debugging messages (optional)
  co.on('msg', function(msg) {
    //console.log('COAPI-Message: ' + msg);
  });

  // Listen for error messages
  co.on('error', function(err) {
    console.log('COAPI-Error: ' + err); // console messages are visible in server report / log on the camera
    process.exit(1);   // restart script in case of (communication) error
  });

  // Refresh image every second (1000ms) once the CamOverlay API is connected
  co.connect().then(function() {
    setInterval(createImage, 1000, co);
  });
}

/**
 * Draw current time as overlay
 * @param {CamOverlayAPI} co
 */
async function createImage(co) {
  // Create a cairo surface to draw graphics (RGB + alpha channel). Wrapper for https://cairographics.org/manual/cairo-Image-Surfaces.html#cairo-image-surface-create
  // width: 240, height: 80 ... using small surface is more effective, don't use transparent overlay in same size as video
  let surfaceResponse = await co.cairo('cairo_image_surface_create', 'CAIRO_FORMAT_ARGB32', 240, 80);
  let surface = surfaceResponse.var;

  // Create a cairo drawing context, wrapper for https://www.cairographics.org/manual/cairo-cairo-t.html#cairo-create
  let cairoResponse = await co.cairo('cairo_create', surface);
  let cairo = cairoResponse.var;

  // Load a png image available in the same folder as this script
  let imgData = fs.readFileSync('icon.png');
  // Create cairo surface from the png image data
  let imgSurfaceResponse = await co.uploadImageData(imgData);
  let imgSurface = imgSurfaceResponse.var;

  // Create black background with opacity 75%
  co.cairo('cairo_rectangle', cairo, 0, 0, 240, 80); // https://www.cairographics.org/manual/cairo-Paths.html#cairo-rectangle
  co.cairo('cairo_set_source_rgba', cairo, 0, 0, 0, 0.75); // https://www.cairographics.org/manual/cairo-cairo-t.html#cairo-set-source-rgba
  co.cairo('cairo_fill', cairo); // https://www.cairographics.org/manual/cairo-cairo-t.html#cairo-fill
  co.cairo('cairo_stroke', cairo); // https://www.cairographics.org/manual/cairo-cairo-t.html#cairo-stroke

  // Create white 2px outline
  co.cairo('cairo_set_line_width', cairo, 2.0); // https://www.cairographics.org/manual/cairo-cairo-t.html#cairo-set-line-width
  co.cairo('cairo_set_source_rgb', cairo, 0.9, 0.9, 0.9); // https://www.cairographics.org/manual/cairo-cairo-t.html#cairo-set-source-rgba
  co.cairo('cairo_rectangle', cairo, 0, 0, 240, 80); // https://www.cairographics.org/manual/cairo-Paths.html#cairo-rectangle
  co.cairo('cairo_stroke', cairo); // https://www.cairographics.org/manual/cairo-cairo-t.html#cairo-stroke

  // Place png image in the main surface
  co.cairo('cairo_translate', cairo, 5, 4); // https://www.cairographics.org/manual/cairo-Transformations.html#cairo-translate
  co.cairo('cairo_scale', cairo, 0.5, 0.5); // https://www.cairographics.org/manual/cairo-Transformations.html#cairo-scale
  co.cairo('cairo_set_source_surface', cairo, imgSurface, 0, 0); // https://www.cairographics.org/manual/cairo-cairo-t.html#cairo-set-source-surface
  co.cairo('cairo_paint', cairo); // https://www.cairographics.org/manual/cairo-cairo-t.html#cairo-paint

  // Draw date text
  co.cairo('cairo_scale', cairo, 2.0, 2.0); // https://www.cairographics.org/manual/cairo-Transformations.html#cairo-scale
  co.cairo('cairo_set_source_rgb', cairo, 0.9, 0.9, 0.9); // https://www.cairographics.org/manual/cairo-cairo-t.html#cairo-set-source-rgba
  let d = new Date();
  co.writeText(cairo, pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' + pad(d.getSeconds(), 2), 75, 10, 150, 38, 'A_LEFT'); // https://github.com/CamStreamer/CamStreamerLib/blob/master/README.md#writetextcairocontext-text-posx-posy-width-height-align

  co.showCairoImage(surface, -1.0, -1.0); // place final image as overlay to video stream from the camera  https://github.com/CamStreamer/CamStreamerLib/blob/master/README.md#showcairoimagecairoimage-posx-posy
  //co.showCairoImageAbsolute(surface, 0, 0, 1920, 1080);  // https://github.com/CamStreamer/CamStreamerLib/blob/master/README.md#showcairoimageabsolutecairoimage-posx-posy-width-height

  // Release memory allocated by cairo objects
  co.cairo('cairo_surface_destroy', imgSurface); // destroy the png image surface
  co.cairo('cairo_surface_destroy', surface); // destroy main surface
  co.cairo('cairo_destroy', cairo); // destroy cairo context
}

function pad(num, size) {
  let sign = Math.sign(num) === -1 ? '-' : '';
  return sign + new Array(size).concat([Math.abs(num)]).join('0').slice(-size);
}

// Run the main function
clockRun();
