export const appInfo = {
    // Adjust application accodingly
    name: 'TEMPer1F',
    packageName: 'temper1fSensor',
    headline: 'TEMPer1F Sensor',
    title: 'TEMPer1F Sensor',
    description:
        'Script that reads data from TEMPer1F USB thermometer. Before use, check that the thermometer cable is fully inserted into the USB stick.',
    getGetUrl() {
        return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=get`;
    },
    getPostUrl() {
        return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=set`;
    },
};
