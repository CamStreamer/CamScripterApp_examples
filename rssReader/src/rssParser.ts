import * as https from 'https';
import * as http from 'http';
import { xml2js, ElementCompact } from 'xml-js';

export type FeedChannel = {
    title: string;
};

export type FeedItem = {
    title: string;
    description: string;
};

export type ParsedFeed = {
    channels: FeedChannel[];
    items: FeedItem[];
};

function getText(el: ElementCompact | undefined): string {
    if (!el) return '';
    if (typeof el === 'string') return el;
    return (el._text as string) || (el._cdata as string) || '';
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#8217;/g, "'").replace(/&#8216;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').replace(/&#8211;/g, '-').replace(/&#8230;/g, '...').replace(/&nbsp;/g, ' ').trim();
}

function toArray<T>(val: T | T[] | undefined): T[] {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
}

function parseRSS2(rss: ElementCompact): ParsedFeed {
    const channel = rss.channel;
    if (!channel) {
        return { channels: [], items: [] };
    }

    const channels: FeedChannel[] = [{
        title: getText(channel.title) || 'Untitled Channel',
    }];

    const rawItems = toArray(channel.item);
    const items: FeedItem[] = rawItems.map((item: ElementCompact) => ({
        title: stripHtml(getText(item.title)),
        description: stripHtml(getText(item.description) || getText(item['content:encoded'])),
    }));

    return { channels, items };
}

function parseAtom(feed: ElementCompact): ParsedFeed {
    const channels: FeedChannel[] = [{
        title: getText(feed.title) || 'Untitled Feed',
    }];

    const rawEntries = toArray(feed.entry);
    const items: FeedItem[] = rawEntries.map((entry: ElementCompact) => ({
        title: stripHtml(getText(entry.title)),
        description: stripHtml(getText(entry.summary) || getText(entry.content)),
    }));

    return { channels, items };
}

export function parseXmlFeed(xml: string): ParsedFeed {
    const parsed = xml2js(xml, { compact: true }) as ElementCompact;

    // RSS 2.0: <rss><channel>...</channel></rss>
    if (parsed.rss) {
        return parseRSS2(parsed.rss);
    }

    // Atom: <feed>...</feed>
    if (parsed.feed) {
        return parseAtom(parsed.feed);
    }

    // RSS 1.0 / RDF: <rdf:RDF>...</rdf:RDF>
    const rdfKey = Object.keys(parsed).find((k) => k.toLowerCase().includes('rdf'));
    if (rdfKey) {
        const rdf = parsed[rdfKey];
        const channelEl = rdf.channel;
        const channels: FeedChannel[] = channelEl
            ? [{ title: getText(channelEl.title) || 'Untitled Channel' }]
            : [];
        const rawItems = toArray(rdf.item);
        const items: FeedItem[] = rawItems.map((item: ElementCompact) => ({
            title: stripHtml(getText(item.title)),
            description: stripHtml(getText(item.description)),
        }));
        return { channels, items };
    }

    return { channels: [], items: [] };
}

export function fetchFeed(url: string, maxRedirects: number = 5): Promise<string> {
    return new Promise((resolve, reject) => {
        if (maxRedirects <= 0) {
            reject(new Error('Too many redirects'));
            return;
        }

        const client = url.startsWith('https') ? https : http;

        client
            .get(url, (res) => {
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    res.resume();
                    fetchFeed(res.headers.location, maxRedirects - 1).then(resolve).catch(reject);
                    return;
                }

                if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
                    reject(new Error('HTTP error: ' + res.statusCode));
                    return;
                }

                const chunks: Buffer[] = [];
                res.on('data', (chunk: Buffer) => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
                res.on('error', (err) => reject(err));
            })
            .on('error', (err) => reject(err));
    });
}
