import { useRef, useState } from 'react';
import { useFormContext, Path } from 'react-hook-form';
import { TAppSchema } from '../models/schema';

export type TCameraListOption = {
    value: number;
    label: string;
};

type Props = {
    camera_list: Path<TAppSchema>;
    protocol: Path<TAppSchema>;
    ipAddress: Path<TAppSchema>;
    port: Path<TAppSchema>;
    user: Path<TAppSchema>;
    pass: Path<TAppSchema>;
};

export const useCameraList = () => {
    const { getValues, setValue } = useFormContext<TAppSchema>();
    const [options, setOptions] = useState<TCameraListOption[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const fetchIdsInProgress = useRef<number[]>([]);
    const abortControllers = useRef<AbortController | null>(null);

    const fetchCameraList = async ({ camera_list, protocol, ipAddress, port, user, pass }: Props) => {
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
                    'x-target-camera-protocol': `${getValues(protocol)}`,
                    'x-target-camera-ip': `${getValues(ipAddress)}`,
                    'x-target-camera-port': `${getValues(port)}`,
                    'x-target-camera-user': `${getValues(user)}`,
                    'x-target-camera-pass': `${getValues(pass)}`,
                    'x-target-camera-path': '/axis-cgi/param.cgi?action=list&group=root.Image',
                }),
                signal: signal,
            });

            const textRes = await res.text();

            // this req is not the latest one -> cancel
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
                setValue(camera_list, [0]);
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
