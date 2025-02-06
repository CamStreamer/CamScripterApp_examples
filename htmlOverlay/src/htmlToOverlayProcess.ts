import { HtmlToOverlay } from './htmlToOverlay';
import { overlaySettingsSchema } from './settingsSchema';

const args = process.argv.slice(2);
if (args.length === 0) {
    throw new Error('No settings provided');
}

const overlaySettings = overlaySettingsSchema.parse(JSON.parse(args[0]));
const htmlToOverlay = new HtmlToOverlay(overlaySettings);
htmlToOverlay.start();

process.on('SIGINT', async () => {
    await htmlToOverlay.stop();
    process.exit();
});

process.on('SIGTERM', async () => {
    await htmlToOverlay.stop();
    process.exit();
});
