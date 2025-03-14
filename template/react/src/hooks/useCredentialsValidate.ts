import { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { TWatches, validateCredentials } from '../utils';
import { TSettings } from '../models/schema';

type Props = {
    name: 'camera' | 'output_camera';
};

export const useCredentialsValidate = ({ name }: Props) => {
    const { control } = useFormContext<TSettings>();
    const [areCredentialsValid, setAreCredentialsValid] = useState<boolean>(true);
    const [lastRequestAborter, setLastRequestAborter] = useState<AbortController | null>(null);

    const proxy: TWatches = {
        protocol: useWatch({ control, name: `${name}.protocol` }),
        ip: useWatch({ control, name: `${name}.ip` }),
        port: useWatch({ control, name: `${name}.port` }),
        user: useWatch({ control, name: `${name}.user` }),
        pass: useWatch({ control, name: `${name}.pass` }),
    };

    useEffect(() => {
        lastRequestAborter?.abort();
        const [aborter, areValidPromise] = validateCredentials(proxy);
        setLastRequestAborter(aborter);

        areValidPromise
            .then((areValid) => {
                setAreCredentialsValid(areValid);
                setLastRequestAborter(null);
            })
            .catch(console.error);
    }, [proxy.protocol, proxy.ip, proxy.port, proxy.user, proxy.pass]);

    return [areCredentialsValid] as const;
};
