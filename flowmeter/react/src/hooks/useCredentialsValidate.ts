import { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { TWatches, validateCredentials, checkConnection } from '../utils';
import { TSettingsSchema } from '../models/schema';

export const useCredentialsValidate = () => {
    const { control } = useFormContext<TSettingsSchema>();
    const [areCredentialsValid, setAreCredentialsValid] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [isCameraResponding, setIsCameraResponding] = useState<boolean>(false);
    const [cameraSerialNumber, setCameraSerialNumber] = useState<unknown>(null);
    const [lastRequestAborter, setLastRequestAborter] = useState<AbortController | null>(null);

    const proxy: TWatches = {
        protocol: useWatch({ control, name: 'camera.protocol' }),
        ip: useWatch({ control, name: 'camera.ip' }),
        port: useWatch({ control, name: 'camera.port' }),
        user: useWatch({ control, name: 'camera.user' }),
        pass: useWatch({ control, name: 'camera.pass' }),
    };

    const validate = async () => {
        if (!proxy.ip || !proxy.port || !proxy.user || !proxy.pass) {
            return;
        }

        try {
            lastRequestAborter?.abort();
            const [aborter, areValidPromise] = validateCredentials(proxy);
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
                    setIsCameraResponding(res.response);
                    const data = res.data as { data: { propertyList: { SerialNumber: string } } };
                    setCameraSerialNumber(data.data.propertyList.SerialNumber);

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
    }, [proxy.protocol, proxy.ip, proxy.port, proxy.user, proxy.pass]);

    useEffect(() => {
        void check();
    }, [areCredentialsValid]);

    return [areCredentialsValid, isFetching, isCameraResponding, check, cameraSerialNumber] as const;
};
