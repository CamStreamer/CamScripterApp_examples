import * as fs from "fs";
import {CameraVapix} from "camstreamerlib/CameraVapix";
import {CamOverlayAPI} from "camstreamerlib/CamOverlayAPI";

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
}

let cv: CameraVapix;
let settings: Settings;

function onEventMessage(event: Event)
{
    event.co.setEnabled(true);
    setTimeout(() => {
        event.co.setEnabled(false);
    }, event.duration)
}

async function reserveEventMessages()
{
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

          cv.on(event.eventName, () =>
          {
                const e =
                {
                    eventName: event.eventName,
                    duration: event.duration,
                    co: co
                }
                onEventMessage(e)
          })
        } catch (error) {
          console.log(
            `Cannot connect to CamOverlay service with ID ${event.serviceID} (${error})`
          );
          process.exit(1);
        }
    }
}

function getSettings()
{
    try {
        const path = process.env.PERSISTENT_DATA_PATH;
        const data = fs.readFileSync(path + "settings.json");
        return JSON.parse(data.toString());
      } catch (error) {
        console.log("Error with Settings file: ", error);
        process.exit(1);
      }
}

async function main()
{
    settings = getSettings();
      
    const options = {
        protocol: "http",
        ip: settings.targetCamera.IP,
        port: settings.targetCamera.port,
        auth: `${settings.targetCamera.user}:${settings.targetCamera.password}`,
    };

    cv = new CameraVapix(options)
    cv.on('eventsDisconnect', (error) => {
        if (error == undefined) {
            console.log('Websocket disconnected.');
        } else {
            console.log('Websocket error: ', error);
        }
        process.exit(1);
    });
    
    await reserveEventMessages();
    cv.eventsConnect('websocket');
}

process.on("unhandledRejection", (reason) => {
    console.log(reason);
    process.exit(1);
});

main();