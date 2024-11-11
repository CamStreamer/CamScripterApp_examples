export const appInfo = {
  //adjust application accodingly
  name: "Papago",
  packageName: "papago_temperature",
  headline: "TEMPer1F Sensor",
  title: "TEMPer1F Sensor",
  getUrl() {
    return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=get`;
  },
};
