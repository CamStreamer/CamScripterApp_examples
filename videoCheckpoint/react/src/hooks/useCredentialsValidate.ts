import { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { TWatches, validateCredentials, checkConnection } from '../utils';
import { TServerData } from '../models/schema';

type Props = {
    name: 'camera' | 'conn_hub' | 'output_camera';
};

export const useCredentialsValidate = ({ name }: Props) => {
    const { control } = useFormContext<TServerData>();
    const [areCredentialsValid, setAreCredentialsValid] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [isCameraResponding, setIsCameraResponding] = useState<boolean>(false);
    const [cameraSerialNumber, setCameraSerialNumber] = useState<unknown>(null);
    const [lastRequestAborter, setLastRequestAborter] = useState<AbortController | null>(null);

    const proxy: TWatches = {
        protocol: useWatch({ control, name: `${name}.protocol` }),
        ip: useWatch({ control, name: `${name}.ip` }),
        port: useWatch({ control, name: `${name}.port` }),
        user: useWatch({ control, name: `${name}.user` }),
        pass: useWatch({ control, name: `${name}.pass` }),
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
                    if (name === 'camera') {
                        const data = res.data as { data: { propertyList: { SerialNumber: string } } };
                        setCameraSerialNumber(data.data.propertyList.SerialNumber);
                    }
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