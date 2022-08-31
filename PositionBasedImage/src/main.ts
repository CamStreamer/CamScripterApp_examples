import * as fs from "fs";
import * as net from "net";
import { CamOverlayAPI } from "camstreamerlib/CamOverlayAPI";

type Camera = {
  IP: string;
  port: number;
  user: string;
  password: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type Settings = {
  targetCamera: Camera;
  areas: {
    coordinates: Coordinates;
    radius: number;
    serviceIDs: number[];
  }[];
};

let activeServices: number[] = [];
let settings: Settings;
let cos: Record<number, CamOverlayAPI> = {};

function deg2rad(angle: number) {
  return (angle * Math.PI) / 180;
}

function calculateDistance(a: Coordinates, b: Coordinates) {
  let aLatRad = deg2rad(a.latitude);
  let aLonRad = deg2rad(a.longitude);
  let bLatRad = deg2rad(b.latitude);
  let bLonRad = deg2rad(b.longitude);

  let sinDiffLat = Math.sin((aLatRad - bLatRad) / 2);
  let sinDiffLon = Math.sin((aLonRad - bLonRad) / 2);
  let aCosLat = Math.cos(aLatRad);
  let bCosLat = Math.cos(bLatRad);

  let c = Math.pow(sinDiffLat, 2) + aCosLat * bCosLat * Math.pow(sinDiffLon, 2);
  return 2000 * 6371 * Math.asin(Math.sqrt(c));
}

function serverResponseParse(lines: string[]): Coordinates {
  let returnValue = null;

  for (const line of lines) {
    let items = line.split(",");
    if (
      items.length >= 7 &&
      items[0] === "$GPRMC" &&
      items[3] !== "" &&
      items[4] !== "" &&
      items[5] !== "" &&
      items[6] !== ""
    ) {
      let lat = Number.parseFloat(items[3]) / 100;
      let lon = Number.parseFloat(items[5]) / 100;

      let latD = Math.floor(lat);
      let latM = ((lat - Math.floor(lat)) * 100) / 60;
      lat = latD + latM;

      let lonD = Math.floor(lon);
      let lonM = ((lon - Math.floor(lon)) * 100) / 60;
      lon = lonD + lonM;

      if (items[4] == "S") {
        lat *= -1;
      }
      if (items[6] == "W") {
        lon *= -1;
      }
      returnValue = { latitude: lat, longitude: lon };
    }
  }
  return returnValue;
}

async function synchroniseCamOverlay() {
  for (let idString in cos) {
    let id = Number.parseInt(idString);
    let isEnabled = await cos[id].isEnabled();
    if (!isEnabled && activeServices.includes(id)) {
      cos[id].setEnabled(true);
    } else if (isEnabled && !activeServices.includes(id)) {
      cos[id].setEnabled(false);
    }
  }
}

function isEqual(a: number[], b: number[]) {
  let equal = a.length == b.length;
  if (equal) {
    for (let i = 0; i < a.length && equal; i++) {
      equal = equal && a[i] == b[i];
    }
  }
  return equal;
}

function getServiceIDs(actualCoordinates: Coordinates) {
  for (let area of settings.areas) {
    let distance = calculateDistance(actualCoordinates, area.coordinates);
    if (distance <= area.radius) {
      return area.serviceIDs.sort();
    }
  }
  return [];
}

function serverConnect() {
  const server = net.createServer((client) => {
    client.setTimeout(30000);

    let dataBuffer = Buffer.alloc(0);
    client.on("data", (data) => {
      dataBuffer = Buffer.concat([dataBuffer, data]);

      let lines = data.toString().split("\r\n");
      lines.pop();
      const coor = serverResponseParse(lines);
      dataBuffer = Buffer.from(lines[lines.length - 1]);

      if (coor !== null) {
        const ids = getServiceIDs(coor);

        if (!isEqual(ids, activeServices)) {
          activeServices = ids;
          synchroniseCamOverlay();
        }
      }
    });

    client.on("timeout", () => {
      console.log("Client request time out.");
      client.end();
      process.exit(1);
    });
  });

  server.listen(10110, () => {
    server.on("close", () => {
      console.log("TCP server socket is closed.");
      process.exit(1);
    });

    server.on("error", (error) => {
      console.log(JSON.stringify(error));
      process.exit(1);
    });

    setInterval(synchroniseCamOverlay, 60000);
  });
}

async function main() {
  try {
    const path = "./localdata/"; //process.env.PERSISTENT_DATA_PATH;
    const data = fs.readFileSync(path + "settings.json");
    settings = JSON.parse(data.toString());
  } catch (error) {
    console.log("Error with Settings file: ", error);
    return;
  }

  let serviceIDs: number[] = [];
  for (let area of settings.areas) {
    area.serviceIDs.sort();

    for (let serviceID of area.serviceIDs) {
      serviceIDs.push(serviceID);
    }
  }

  for (let serviceID of serviceIDs) {
    const options = {
      ip: settings.targetCamera.IP,
      port: settings.targetCamera.port,
      auth: `${settings.targetCamera.user}:${settings.targetCamera.password}`,
      serviceID,
    };
    try {
      const co = new CamOverlayAPI(options);
      await co.connect();
      await co.setEnabled(false);
      cos[serviceID] = co;
    } catch (error) {
      console.log(`Cannot connect to CamOverlay service with ID ${serviceID}`);
      console.log(error);
    }
  }
  serverConnect();
}

process.on("unhandledRejection", (reason) => {
  console.log(reason);
  process.exit(1);
});

main();
