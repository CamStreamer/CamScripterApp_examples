import { useRef, useState } from 'react';

import { useFormContext } from 'react-hook-form';
import { TServerData } from '../models/schema';

type Props = {
    name: 'camera' | 'output_camera';
};

export const useResolutionList = ({ name }: Props) => {
    const { getValues } = useFormContext<TServerData>();
    const [options, setOptions] = useState<string[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const fetchIdsInProgress = useRef<number[]>([]);
    const abortControllers = useRef<AbortController | null>(null);

    const fetchResolutionList = async () => {
        const fetchId = Math.round(Math.random() * 10000);
        fetchIdsInProgress.current.push(fetchId);
        setIsFetching(true);

        if (abortControllers.current !== null) {
            abortControllers.current.abort();
            abortControllers.current = null;
        }

        try {
            const controller = new AbortController();
            abortControllers.current = controller;
            const signal = controller.signal;
            const res = await fetch('/local/camscripter/proxy.cgi', {
                headers: new Headers({
                    'x-target-camera-protocol': `${getValues(`${name}.protocol`)}`,
                    'x-target-camera-ip': `${getValues(`${name}.ip`)}`,
                    'x-target-camera-port': `${getValues(`${name}.port`)}`,
                    'x-target-camera-user': `${getValues(`${name}.user`)}`,
                    'x-target-camera-pass': `${getValues(`${name}.pass`)}`,
                    'x-target-camera-path': '/axis-cgi/param.cgi?action=list&group=root.Properties.Image.Resolution',
                }),
                signal: signal,
            });

            const textRes = await res.text();

            // This req is not the latest one -> cancel
            if (fetchId !== fetchIdsInProgress.current[fetchIdsInProgress.current.length - 1]) {
                return;
            }

            const lines = textRes.split(/[\r\n]/);
            const options: string[] = [];

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].length) {
                    const p = lines[i].split('=');
                    const resolutions = p[1].split(',');
                    options.push(...resolutions);
                }
            }

            setOptions(options);
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

    return [options, fetchResolutionList, isFetching] as const;
};
