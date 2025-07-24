import { useRef, useState } from 'react';

import { useFormContext } from 'react-hook-form';
import { TSettings } from '../models/schema';

export type TCameraListOption = {
    value: number;
    label: string;
};

export const useCameraList = () => {
    const { getValues, setValue } = useFormContext<TSettings>();
    const [options, setOptions] = useState<TCameraListOption[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const fetchIdsInProgress = useRef<number[]>([]);
    const abortControllers = useRef<AbortController | null>(null);

    const fetchCameraList = async () => {
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
                    'x-target-camera-protocol': 'http',
                    'x-target-camera-ip': `${getValues('camera_ip')}`,
                    'x-target-camera-port': `${getValues('camera_port')}`,
                    'x-target-camera-user': `${getValues('camera_user')}`,
                    'x-target-camera-pass': `${getValues('camera_pass')}`,
                    'x-target-camera-path': '/axis-cgi/param.cgi?action=list&group=root.Image',
                }),
                signal: signal,
            });

            const textRes = await res.text();

            // This req is not the latest one -> cancel
            if (fetchId !== fetchIdsInProgress.current[fetchIdsInProgress.current.length - 1]) {
                return;
            }

            const params: Record<string, string> = {};
            const lines = textRes.split(/[\r\n]/);
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].length) {
                    const p = lines[i].split('=');
                    if (p.length >= 2) {
                        params[p[0]] = p[1];
                    }
                }
            }

            const options: TCameraListOption[] = [];

            let i = 0;
            while (params[`root.Image.I${i}.Enabled`] !== undefined) {
                if (params[`root.Image.I${i}.Source`] === 'quad') {
                    i++;
                    continue;
                }
                if (params[`root.Image.I${i}.Enabled`] === 'yes') {
                    options.push({
                        value: i,
                        label: params[`root.Image.I${i}.Name`],
                    });
                }
                i++;
            }

            setOptions(options);
            setIsFetching(false);
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                setValue('camera_list', [0]);
                setOptions([]);
                setIsFetching(false);
            }
        } finally {
            fetchIdsInProgress.current = fetchIdsInProgress.current.filter((id) => fetchId !== id);
            abortControllers.current = null;
        }
    };

    return [options, fetchCameraList, isFetching] as const;
};
