export const appInfo = {
    //adjust application accodingly
    name: 'Papago',
    packageName: 'papago_temperature',
    headline: 'PAPAGO Temperature (IP device)',
    title: 'PAPAGO Temperature',
    getGetUrl() {
        return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=get`;
    },
    getPostUrl() {
        return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=set`;
    },
};
