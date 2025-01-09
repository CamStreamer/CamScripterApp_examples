export const appInfo = {
    // Adjust application accodingly
    packageName: 'weighing_scale',
    headline: 'Weighing Scale Integration',
    title: 'Weighing Scale Integration',
    getGetUrl() {
        return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=get`;
    },
    getPostUrl() {
        return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=set`;
    },
};
