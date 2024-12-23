import * as fs from "fs";
import * as net from "net";
import { CameraVapix } from "camstreamerlib/CameraVapix";
import { TAppSchema, applicationSchema } from "../react/src/models/schema";

let settings: TAppSchema;
let cv: CameraVapix;
let client: net.Socket;
let prevWeightData: string | null = null;
let dataBuffer = "";

// Read script configuration
function readSettings() {
  try {
    const data = fs.readFileSync(
      process.env.PERSISTENT_DATA_PATH + "settings.json"
    );
    return applicationSchema.parse(data.toString());
  } catch (err) {
    console.log(
      "Read settings error:",
      err instanceof Error ? err.message : "unknown"
    );
    process.exit(1);
  }
}

function main() {
  try {
    settings = readSettings();

    // Create camera client for http requests
    if (
      settings.camera.ip.length !== 0 &&
      settings.camera.user.length !== 0 &&
      settings.camera.pass.length !== 0
    ) {
      cv = new CameraVapix({
        tls: settings.camera.protocol !== "http",
        tlsInsecure: settings.camera.protocol === "https_insecure",
        ip: settings.camera.ip,
        port: settings.camera.port,
        user: settings.camera.user,
        pass: settings.camera.pass,
      });
    }

    // Connect to electronic scale
    if (
      settings.scale.ip.length !== 0 &&
      settings.scale.port !== 0 &&
      cv !== undefined
    ) {
      client = new net.Socket();
      client.connect(settings.scale.port, settings.scale.ip, () => {
        console.log("Scale connected");
        setInterval(() => {
          client.write(Buffer.from("1B70", "hex"));
        }, settings.scale.refresh_rate);
      });

      client.on("data", (data) => {
        dataBuffer += data.toString("hex");
        const messageEnd = dataBuffer.indexOf("\r\n");
        if (messageEnd === -1) {
          return;
        }
        const weightData = dataBuffer.substring(0, messageEnd);
        dataBuffer = "";

        if (prevWeightData !== weightData) {
          prevWeightData = weightData;

          // Parse weight and unit
          const weight = prevWeightData.substring(0, 9);
          const unit = prevWeightData.substring(9);

          try {
            cv.vapixGet(
              "/local/camoverlay/api/textAndBackground.cgi?service_id=" +
                settings.camera.service_id +
                "&" +
                settings.camera.value_field_name +
                "=" +
                weight +
                "&" +
                settings.camera.unit_field_name +
                "=" +
                unit
            ).then(
              (response) => {
                console.log(response);
              },
              function (err) {
                console.error(err);
              }
            );
          } catch (err) {
            console.error("Camera overlay error: " + err);
          }
        }
      });
    }
  } catch (err) {
    console.error("Application start:", err);
    process.exit(1);
  }
}

process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (err: Error) => {
  console.error("Unhandled rejection:", err);
});

main();
