const { CamOverlayAPI } = require("camstreamerlib/CamOverlayAPI");
const SpinelDevice = require("./SpinelDevice");
const fs = require("fs");
const CairoFrame = require("./CairoFrame");
const CairoPainter = require("./CairoPainter");
const MemoryManager = require("./utils");
const { readJsonSync } = require("fs-extra");

const VENDOR_ID = 0x0403;
const PRODUCT_ID = 0x6001;
let device;
let co;
let layout;
let mm;

process.on("SIGTERM", async () => {
  widget.close();
  await device.close();
  process.exit(0);
});

function parseCounterData(data) {
  let result = 0;
  let byte_number = data[0] / 8;
  for (let i = 1; i < data.length; i += byte_number) {
    let res = 0;
    for (let y = 0; y < byte_number; y++) {
      res = res << 8;
      res += data[i + y];
    }
    result = res;
  }
  return result;
}

async function prepareApp(settings) {
  co = new CamOverlayAPI({
    ip: settings.camera_ip,
    port: 80,
    auth: settings.camera_user + ":" + settings.camera_pass,
    serviceID: -1,
  });
  co.on("msg", function (msg) {
    //console.log('COAPI-Message: ' + msg);
  });

  co.on("error", function (err) {
    console.log("COAPI-Error: " + err);
  });

  co.on("close", function () {
    console.log("COAPI-Error: connection closed");
    process.exit(1);
  });

  device = new SpinelDevice(VENDOR_ID, PRODUCT_ID);
  await device.connect();
  await co.connect();
  mm = new MemoryManager(co);
  prepareImages(mm);
  await createLayout(1920, 1080, mm, settings);
}

function prepareImages(mm) {
  mm.registerImage("1", "1.png");
  mm.registerImage("2", "2.png");
  mm.registerImage("3", "3.png");
  mm.registerImage("4", "4.png");
  mm.registerImage("bg", "WidgetPifko.gif");
}

async function createLayout(resolution_w, resolution_h, mm, settings) {
  layout = {};
  layout.background = new CairoPainter(
    resolution_w,
    resolution_h,
    settings.coord,
    settings.pos_x,
    settings.pos_y,
    500,
    760,
    null,
    null,
    null
  );
  layout.background.setBgImage(await mm.image("bg"), "fit");
  layout.start_time = new CairoFrame(
    35,
    250,
    180,
    50,
    null,
    "",
    [1.0, 1.0, 1.0]
  );
  layout.start_time.setText(settings.start_time, "A_CENTER");
  layout.current_time = new CairoFrame(
    260,
    250,
    180,
    50,
    null,
    "",
    [1.0, 1.0, 1.0]
  );
  layout.current_time.setText("12:20", "A_CENTER");
  layout.current_beer = new CairoFrame(
    310,
    420,
    98,
    126,
    null,
    "",
    [1.0, 1.0, 1.0]
  );
  layout.current_beer.setBgImage(await mm.image("1"), "fit");
  layout.beer_background = new CairoFrame(
    90,
    420,
    98,
    126,
    null,
    "",
    [1.0, 1.0, 1.0]
  );
  layout.beer_background.setBgImage(await mm.image("1"), "fit");
  layout.beer_count = new CairoFrame(
    100,
    445,
    55,
    55,
    null,
    "",
    [1.0, 1.0, 1.0]
  );
  layout.beer_count.setText("24", "A_CENTER");
  layout.agegrate = new CairoFrame(50, 580, 400, 90, null, "", [1.0, 1.0, 1.0]);
  layout.agegrate.setText("62.00 l", "A_CENTER");
  layout.name = new CairoFrame(50, 690, 400, 40, null, "", [1.0, 1.0, 1.0]);
  layout.name.setText(settings.group_name, "A_CENTER");

  layout.background.insert(layout.start_time);
  layout.background.insert(layout.current_time);
  layout.background.insert(layout.current_beer);
  layout.background.insert(layout.beer_background);
  layout.background.insert(layout.beer_count);
  layout.background.insert(layout.agegrate);
  layout.background.insert(layout.name);
}

function getBaseVolume() {
  let json = readJsonSync(process.env.PERSISTENT_DATA_PATH + "/values.json");
  return json["aggregate_volume"];
}

async function setBaseVolume(vol) {
  fs.writeFileSync(
    process.env.PERSISTENT_DATA_PATH + "/values.json",
    JSON.stringify({
      aggregate_volume: vol,
    })
  );
}

let last_update = Date.now();
let aggregate_volume = getBaseVolume();

async function appRun(settings) {
  let data = await device.send97Request(0xfe, Buffer.from("6081", "hex"));
  let now = Date.now();
  if (data.ack === 0) {
    let cntr = parseCounterData(data.data);
    let volume = cntr / settings.k_factor;
    aggregate_volume += volume;
    setBaseVolume(aggregate_volume);
    let time_passed = (now - last_update) / 1000;

    console.log(
      "Flow: " + volume.toString() + "/" + time_passed.toString() + "s"
    );
    console.log("Volume: " + aggregate_volume.toString());
    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes().toString().padStart(2, '0');
    layout.current_time.setText(hours + ":" + minutes);
    layout.current_beer.setBgImage(
      await mm.image(getBeerIndex(aggregate_volume)),
      "fit"
    );
    layout.agegrate.setText(aggregate_volume.toFixed(2) + " l");
    layout.beer_count.setText(Math.floor(aggregate_volume * 2).toString());
    layout.background.generateImage(co, 1);
  } else {
    console.log("ACK:" + data.ack);
  }
  last_update = now;
}

function getBeerIndex(liters) {
  let current = (liters % 0.5) * 1000; //ml
  if (current < 125) {
    return "1";
  } else if (current < 250) {
    return "2";
  } else if (current < 375) {
    return "3";
  } else {
    return "4";
  }
}

class TimeoutWidget {
  constructor(prep_f, period_ms, period_f) {
    this.period = period_ms;
    this.period_f = period_f;
    this.prep_f = prep_f;
    this.settings = undefined;
    this.timer = undefined;
  }

  _loadSettings() {
    const data = fs.readFileSync(
      process.env.PERSISTENT_DATA_PATH + "settings.json"
    );
    this.settings = JSON.parse(data);
  }

  async start() {
    this._loadSettings();
    await this.prep_f(this.settings);
    this.timer = setTimeout(() => {
      this._one_period();
    }, this.period);
  }
  async _one_period() {
    try {
      await this.period_f(this.settings);
    } catch (err) {
      console.err(err);
    } finally {
      this.timer = setTimeout(() => {
        this._one_period();
      }, this.period);
    }
  }

  close() {
    clearTimeout(this.timer);
  }
}

let widget = new TimeoutWidget(prepareApp, 1000, appRun);
widget.start();
