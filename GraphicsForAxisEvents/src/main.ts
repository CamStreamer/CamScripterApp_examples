import * as fs from "fs";
import { CameraVapix } from "camstreamerlib/CameraVapix";
import { CamOverlayAPI } from "camstreamerlib/CamOverlayAPI";

type Camera = {
  IP: string;
  port: number;
  user: string;
  password: string;
};

type Settings = {
  sourceCamera: Camera;
  targetCamera: Camera;
  modem: Camera;
  events: {
    eventName: string;
    serviceID: number;
    duration: number;
  }[];
};

type Event = {
  eventName: string;
  duration: number;
  co: CamOverlayAPI;
  lastTimeout: NodeJS.Timeout;
};

function onEventMessage(event: Event) {
  event.co.setEnabled(true);
  if (event.duration >= 1) {
    if (event.lastTimeout !== null) {
      clearTimeout(event.lastTimeout);
    }
    event.lastTimeout = setTimeout(() => {
      event.co.setEnabled(false);
      event.lastTimeout = null;
    }, event.duration);
  }
}

function getSettings() {
  try {
    const path = "./localdata/"; //process.env.PERSISTENT_DATA_PATH;
    const data = fs.readFileSync(path + "settings.json");
    return JSON.parse(data.toString());
  } catch (error) {
    console.log("Error with Settings file: ", error);
    process.exit(1);
  }
}

async function prepareCamOverlay(settings: Settings) {
  const cos: Record<number, CamOverlayAPI> = {};
  for (let event of settings.events) {
    const options = {
      ip: settings.targetCamera.IP,
      port: settings.targetCamera.port,
      auth: `${settings.targetCamera.user}:${settings.targetCamera.password}`,
      serviceID: event.serviceID,
    };
    try {
      const co = new CamOverlayAPI(options);
      await co.connect();
      await co.setEnabled(false);
      cos[event.serviceID] = co;
    } catch (error) {
      console.log(
        `Cannot connect to CamOverlay service with ID ${event.serviceID} (${error})`
      );
      process.exit(1);
    }
  }
  return cos;
}

async function subscribeEventMessages(
  settings: Settings,
  cos: Record<number, CamOverlayAPI>
) {
  const options = {
    protocol: "http",
    ip: settings.targetCamera.IP,
    port: settings.targetCamera.port,
    auth: `${settings.targetCamera.user}:${settings.targetCamera.password}`,
  };

  const cv = new CameraVapix(options);
  cv.on("eventsDisconnect", (error) => {
    if (error == undefined) {
      console.log("Websocket disconnected.");
    } else {
      console.log("Websocket error: ", error);
    }
    process.exit(1);
  });

  for (let event of settings.events) {
    cv.on(event.eventName, () => {
      const e = {
        eventName: event.eventName,
        duration: event.duration,
        co: cos[event.serviceID],
        lastTimeout: null,
      };
      onEventMessage(e);
    });
  }
  cv.eventsConnect("websocket");
}

async function main() {
  const settings = getSettings();
  const cos = await prepareCamOverlay(settings);
  subscribeEventMessages(settings, cos);
}

process.on("unhandledRejection", (reason) => {
  console.log(reason);
  process.exit(1);
});

main();
