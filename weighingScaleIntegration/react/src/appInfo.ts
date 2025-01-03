export const appInfo = {
    // Adjust application accodingly
    packageName: 'scaleReader',
    headline: 'Weighing Scale Integration',
    title: 'Scale Reader',
    description:
        'Integration of the G&G E6000YA electronic scale together with the Lantronix UDS2100 RS232/485/422 converter.',
    getGetUrl() {
        return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=get`;
    },
    getPostUrl() {
        return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=set`;
    },
};
