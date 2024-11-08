import { TSettings } from "./schema";

export const mockedSettings: TSettings = {
  //adjust application accodingly
  application: {
    protocol: "http",
    ip: "192.168.91.247",
    port: 80,
    portID: "1",
    updateFrequency: 1,
  },
  camera: {
    protocol: "http",
    ip: "127.0.0.1",
    port: 80,
    user: "root",
    pass: "",
    serviceID: 1,
    fieldName: "",
  },
};
