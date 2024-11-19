import { useRef, useState } from 'react';

export type TCameraOption = {
    name: string;
    ip: string[];
};

type TCameraOptionResponse = {
    message: string;
};

export const useCameraOptions = () => {
    const [options, setOptions] = useState<TCameraOption[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const fetchIdsInProgress = useRef<number[]>([]);
    const abortControllers = useRef<AbortController | null>(null);

    const fetchCameraOptions = async () => {
        const fetchId = Math.round(Math.random() * 10000);
        fetchIdsInProgress.current.push(fetchId);
        setIsFetching(true);

        try {
            const res = await fetch('/local/camscripter/network_camera_list.cgi');
            const resData: TCameraOptionResponse = await res.json();

            // this req is not the latest one -> cancel
            if (fetchId !== fetchIdsInProgress.current[fetchIdsInProgress.current.length - 1]) {
                return;
            }
            setOptions(JSON.parse(resData.message));
            setIsFetching(false);
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                setOptions([]);
                setIsFetching(false);
            }
        } finally {
            fetchIdsInProgress.current = fetchIdsInProgress.current.filter((id) => fetchId !== id);
            abortControllers.current = null;
        }
    };

    return [options, fetchCameraOptions, isFetching] as const;
};
