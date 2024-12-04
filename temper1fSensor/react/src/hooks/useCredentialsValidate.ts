import { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { TWatches, validateCredentials } from '../utils';
import { TAppSchema } from '../models/schema';

type Props = {
    name: 'camera' | 'acs' | 'event_camera';
    path: string;
};

export const useCredentialsValidate = ({ name, path }: Props) => {
    const { control } = useFormContext<TAppSchema>();
    const [areCredentialsValid, setAreCredentialsValid] = useState<boolean>(true);
    const [lastRequestAborter, setLastRequestAborter] = useState<AbortController | null>(null);
    const [isFetching, setIsFetching] = useState<boolean>(false);

    const proxy: TWatches = {
        protocol: useWatch({ control, name: `${name}_protocol` }),
        ip: useWatch({ control, name: `${name}_ip` }),
        port: useWatch({ control, name: `${name}_port` }),
        user: useWatch({ control, name: `${name}_user` }),
        pass: useWatch({ control, name: `${name}_pass` }),
    };

    const validate = async () => {
        if (!proxy.ip || !proxy.port || !proxy.user || !proxy.pass) {
            return;
        }

        setIsFetching(true);

        try {
            lastRequestAborter?.abort();
            const [aborter, areValidPromise] = validateCredentials(proxy, path);
            setLastRequestAborter(aborter);

            await areValidPromise
                .then((areValid) => {
                    setAreCredentialsValid(areValid);
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

    return [areCredentialsValid, isFetching, validate] as const;
};
