import { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { checkConnection, TWatches } from '../utils';
import { TSettings } from '../models/schema';

export const useCredentialsValidate = () => {
    const { control } = useFormContext<TSettings>();
    const [areCredentialsValid, setAreCredentialsValid] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [isCameraResponding, setIsCameraResponding] = useState<boolean>(false);
    const [lastRequestAborter, setLastRequestAborter] = useState<AbortController | null>(null);

    const proxy: TWatches = {
        protocol: useWatch({ control, name: 'camera_protocol' }),
        ip: useWatch({ control, name: 'camera_ip' }),
        port: useWatch({ control, name: 'camera_port' }),
        user: useWatch({ control, name: 'camera_user' }),
        pass: useWatch({ control, name: 'camera_pass' }),
    };

    const validate = async () => {
        if (!proxy.ip || !proxy.port || !proxy.user || !proxy.pass) {
            return;
        }

        try {
            lastRequestAborter?.abort();
            const [aborter, areValidPromise] = checkConnection(proxy);
            setLastRequestAborter(aborter);

            await areValidPromise
                .then((areValid) => {
                    setAreCredentialsValid(areValid);
                    setLastRequestAborter(null);
                })
                .catch(console.error);
        } catch (err) {
            console.error(err);
        }
    };

    const check = async () => {
        if (!proxy.ip || !proxy.port || !proxy.user || !proxy.pass) {
            return;
        }

        if (!areCredentialsValid) {
            return;
        }

        setIsFetching(true);

        try {
            lastRequestAborter?.abort();
            const [aborter, cameraResponsePromise] = checkConnection(proxy);
            setLastRequestAborter(aborter);

            await cameraResponsePromise
                .then((res) => {
                    setIsCameraResponding(res);
                    setLastRequestAborter(null);
                })
                .catch(console.error);
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        void validate();
    }, [proxy.ip, proxy.port, proxy.user, proxy.pass, proxy.protocol]);

    useEffect(() => {
        void check();
    }, [areCredentialsValid]);

    return {
        areCredentialsValid,
        isFetching,
        isCameraResponding,
        check,
    } as const;
};
