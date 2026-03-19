import * as fs from 'fs';
import * as url from 'url';
import { CamOverlayAPI } from 'camstreamerlib/CamOverlayAPI';
import { HttpServer } from 'camstreamerlib/HttpServer';
import { settingsSchema, TSettings } from './schema';
import { fetchFeed, parseXmlFeed, FeedItem } from './rssParser';

let settings: TSettings;
let co: InstanceType<typeof CamOverlayAPI>;
let items: FeedItem[] = [];
let currentIndex = 0;
let intervalHandle: NodeJS.Timeout | null = null;

function readSettings(): TSettings {
    const dataPath = process.env.PERSISTENT_DATA_PATH || './localdata/';
    const data = fs.readFileSync(dataPath + 'settings.json');
    return settingsSchema.parse(JSON.parse(data.toString()));
}

function getDisplayText(item: FeedItem): string {
    if (settings.content_type === 'description') {
        return item.description || item.title;
    }
    return item.title;
}

async function pushText(text: string): Promise<void> {
    const serviceId = settings.service_id || 1;

    if (settings.output_type === 'custom_graphics') {
        const fieldName = settings.cg_field_name || 'field1';
        await co.updateCGText(serviceId, [{ field_name: fieldName, text }]);
    } else {
        await co.updateInfoticker(serviceId, encodeURIComponent(text));
    }
}

async function displayNextItem(): Promise<void> {
    if (items.length === 0) return;

    if (currentIndex >= items.length) {
        // Re-fetch feed after cycling through all items
        clearInterval(intervalHandle!);
        intervalHandle = null;
        console.log('All items displayed, re-fetching RSS feed');
        await fetchAndStart();
        return;
    }

    const item = items[currentIndex];
    const text = getDisplayText(item);
    currentIndex++;

    console.log(`Displaying item ${currentIndex}/${items.length}: ${text.substring(0, 80)}...`);

    try {
        await pushText(text);
    } catch (err) {
        console.log('Error pushing text: ' + err);
    }
}

async function fetchAndStart(): Promise<void> {
    const feedUrl = settings.rss_url || 'https://www.nasa.gov/rss/dyn/breaking_news.rss';
    const interval = (settings.update_interval || 10) * 1000;

    try {
        const xml = await fetchFeed(feedUrl);
        const feed = parseXmlFeed(xml);

        if (feed.items.length === 0) {
            console.log('No items found in RSS feed, retrying in ' + (interval / 1000) + 's');
            setTimeout(fetchAndStart, interval);
            return;
        }

        items = feed.items;
        currentIndex = 0;
        console.log(`Fetched ${items.length} items from: ${feed.channels[0]?.title || feedUrl}`);

        // Display first item immediately
        await displayNextItem();

        intervalHandle = setInterval(() => {
            displayNextItem();
        }, interval);
    } catch (err) {
        console.log('Error fetching RSS: ' + err);
        setTimeout(fetchAndStart, interval);
    }
}

function startHttpServer(): void {
    const httpServer = new HttpServer();

    httpServer.onRequest('/load_feed.cgi', async (req: any, res: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        const parsedUrl = url.parse(req.url, true);
        const feedUrl = parsedUrl.query.url as string;

        if (!feedUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
        }

        try {
            const xml = await fetchFeed(feedUrl);
            const feed = parseXmlFeed(xml);
            res.statusCode = 200;
            res.end(JSON.stringify(feed));
        } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || String(err) }));
        }
    });
}

function main(): void {
    try {
        settings = readSettings();
    } catch (err) {
        console.log('Failed to read settings: ' + err);
        return;
    }

    co = new CamOverlayAPI({
        ip: settings.camera_ip || '127.0.0.1',
        port: settings.camera_port || 80,
        auth: settings.camera_user + ':' + settings.camera_pass,
    });

    startHttpServer();
    fetchAndStart();
}

process.on('unhandledRejection', (error: any) => {
    console.log('unhandledRejection', error?.message || error);
});
process.on('uncaughtException', (error: any) => {
    console.log('uncaughtException', error?.message || error);
});

main();
