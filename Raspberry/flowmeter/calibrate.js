const SpinelDevice = require("./SpinelDevice");
const fs = require("fs");

VENDOR_ID = 0x0403;
PRODUCT_ID = 0x6001;

appRun(process.argv[2]);

async function appRun(volume) {
  const settings = GetSettings();
  let device = new SpinelDevice(VENDOR_ID, PRODUCT_ID);
  await device.connect();
  let data = await device.send97Request(0xfe, Buffer.from("6081", "hex"));
  settings.k_factor = Math.round(parseCounterData(data) / volume);

  console.log(
    "Calibration done! K factor now set to: " +
      settings.k_factor +
      "pulses/liter"
  );
  SaveSettings(settings);
  await device.close();
}

function GetSettings() {
  const data = fs.readFileSync("./localdata/settings.json");
  return JSON.parse(data);
}

function SaveSettings(object) {
  fs.writeFileSync(
    "./localdata/settings.json",
    JSON.stringify(object),
    function (err) {
      if (err) throw err;
    }
  );
}

function parseCounterData(data) {
  let byte_number = data[0] / 8;
  let results = [];

  for (let i = 1; i < data.length; i += byte_number) {
    let res = 0;
    for (let y = 0; y < byte_number; y++) {
      res = res << 8;
      res += data[i + y];
    }
    results = res;
  }
  return results;
}
