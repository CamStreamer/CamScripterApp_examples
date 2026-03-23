import { useState, useCallback } from 'react';

export type TFeedChannel = {
    title: string;
};

type TLoadFeedResult = {
    channels: TFeedChannel[];
    items: { title: string; description: string }[];
};

export const useLoadChannels = () => {
    const [channels, setChannels] = useState<TFeedChannel[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadChannels = useCallback(async (rssUrl: string) => {
        if (!rssUrl) {
            setChannels([]);
            setError('Please enter a feed URL');
            return;
        }

        setIsFetching(true);
        setError(null);

        try {
            const proxyUrl = `/local/camscripter/proxy/rss_reader/load_feed.cgi?url=${encodeURIComponent(rssUrl)}`;

            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data: TLoadFeedResult = await response.json();

            if (data.channels?.length > 0) {
                setChannels(data.channels);
            } else {
                setChannels([]);
                setError('No channel available');
            }
        } catch (err: any) {
            setChannels([]);
            setError(err.message || 'Failed to load feed');
        } finally {
            setIsFetching(false);
        }
    }, []);

    return { channels, isFetching, error, loadChannels } as const;
};
