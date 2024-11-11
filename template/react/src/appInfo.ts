export const appInfo = {
  //adjust application accodingly
  name: "Papago",
  packageName: "papago_temperature",
  headline: "PAPAGO Temperature (IP device)",
  title: "PAPAGO Temperature",
  getUrl() {
    return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=get`;
  },
};
