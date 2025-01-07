export const appInfo = {
    // Adjust application accodingly
    packageName: 'weighing_scale',
    headline: 'Weighing Scale Integration',
    title: 'Weighing Scale Integration',
    description:
        'Integration of the G&G E6000YA electronic scale together with the Lantronix UDS2100 RS232/485/422 or USR-TCP232-302 converter.',
    getGetUrl() {
        return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=get`;
    },
    getPostUrl() {
        return `/local/camscripter/package/settings.cgi?package_name=${this.packageName}&action=set`;
    },
};
