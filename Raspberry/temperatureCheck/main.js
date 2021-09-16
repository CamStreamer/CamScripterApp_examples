const SerialPort = require("serialport");
const CamOverlayAPI = require("camstreamerlib/CamOverlayAPI");
const CairoPainter = require("./CairoPainter");
const CairoFrame = require("./CairoFrame");
const MemoryManager = require("./utils");
const fs = require("fs");
VENDOR_ID = (0x1a86).toString(16);
PRODUCT_ID = (0x7523).toString(16);

let settings = null;
let layout = {};
let mm = null;
const WHITE = [1.0, 1.0, 1.0];

try {
  console.log(process.env.PERSISTENT_DATA_PATH + "settings.json");
  let data = fs.readFileSync(
    process.env.PERSISTENT_DATA_PATH + "settings.json"
  );
  settings = JSON.parse(data);
} catch (err) {
  console.log("No settings file found");
  return;
}

let co = new CamOverlayAPI({
  ip: settings.camera_ip,
  port: settings.camera_port,
  auth: settings.camera_user + ":" + settings.camera_pass,
  serviceName: "Temperature Check",
});

async function registerResources(mm) {
  mm.registerFont("open_sans", "OpenSans-Regular.ttf");
  mm.registerImage("no_face", "png/whatever_static.png");
  mm.registerImage("happy_face", "png/happy_static.png");
  mm.registerImage("sad_face", "png/sad_static.png");
  mm.registerImage("sad_animation", "gif/sad.gif");
  mm.registerImage("happy_animation", "gif/happy.gif");
}

async function makeLayout(mm) {
  layout["base"] = new CairoPainter(
    settings.res_w,
    settings.res_h,
    settings.coordinates,
    settings.pos_x,
    settings.pos_y,
    461,
    177,
    null,
    null,
    [1.0, 1.0, 1.0]
  );
  layout["base"].setBgImage(await mm.image("no_face"), "fit");
  layout["base"].setFont(await mm.font("open_sans"));

  layout["text"] = new CairoFrame(
    220,
    40,
    200,
    70,
    null,
    null,
    [1.0, 1.0, 1.0]
  );
  layout["text"].setText("NO DATA", "A_RIGHT", WHITE);
  layout["base"].insert(layout["text"]);
}

const UNITS = { f: "°F", c: "°C" };
const RATIOS = { f: [1.8, 32], c: [1, 0] }; //  relation to Celsius

async function appRun() {
  let list = await SerialPort.list();
  console.log(JSON.stringify(list));
  let our_port;
  for (let port of list) {
    if (
      "vendorId" in port &&
      port["vendorId"] === VENDOR_ID &&
      "productId" in port &&
      port["productId"] === PRODUCT_ID
    ) {
      our_port = port;
    }
  }
  console.log(JSON.stringify(our_port));
  let parser2 = new SerialPort.parsers.Readline("\n");
  let port_handle = new SerialPort(our_port.path, {
    baudRate: 115200,
  });

  port_handle.on('close', ()=>{
    console.log("Serial Error: connection closed");
    process.exit(1);
  });

  process.on("exit", () => {
    port_handle.close();
  });

  console.log(our_port.path);

  co.on("error", (err) => {
    console.log("COAPI-Error: " + err);
  });

  co.on("close", () => {
    console.log("COAPI-Error: connection closed");
    process.exit(1);
  });

  await co.connect();
  mm = new MemoryManager(
    co,
    process.env.INSTALL_PATH + "/images",
    process.env.INSTALL_PATH + "/fonts"
  );
  await registerResources(mm);
  await makeLayout(mm);
  layout["base"].generateImage(co, settings.scale / 100);
  const parser = port_handle.pipe(parser2);
  parser.on("data", async function (data) {
    let line = data.toString();
    if (line.match(/T body/)) {
      if (line.match("compensate")) {
        return;
      }
      console.log(line);
      let numbers = parseFloat(line.match(/[0-9\.]+/));
      if (numbers > settings.threshold) {
        layout["base"].setBgImage(await mm.image("sad_face"));
      } else {
        layout["base"].setBgImage(await mm.image("happy_face"));
      }
      layout["text"].setText(temperature(numbers, settings.unit));
      layout["base"].generateImage(co, settings.scale / 100);
    } else if (line.match(/Away/)) {
      console.log("Away");
      layout["base"].setBgImage(await mm.image("no_face"));
      layout["text"].setText("NO DATA");
      layout["base"].generateImage(co, settings.scale / 100);
    }
  });
}

function temperature(num, unit_tag) {
  let r = RATIOS[unit_tag];
  return (num * r[0] + r[1]).toFixed(2) + " " + UNITS[unit_tag];
}

appRun();
