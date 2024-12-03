import { useState, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { TWatches, validateCredentials } from '../utils';
import { TAppSchema } from '../models/schema';

type Props = {
    protocol: 'camera_protocol' | 'acs_protocol' | 'event_camera_protocol';
    ipAddress: 'camera_ip' | 'acs_ip' | 'event_camera_ip';
    port: 'camera_port' | 'acs_port' | 'event_camera_port';
    user: 'camera_user' | 'acs_user' | 'event_camera_user';
    pass: 'camera_pass' | 'acs_pass' | 'event_camera_pass';
};

export const useCredentialsValidate = ({ protocol, ipAddress, port, user, pass }: Props) => {
    const { control } = useFormContext<TAppSchema>();
    const [areCredentialsValid, setAreCredentialsValid] = useState<boolean>(true);
    const [lastRequestAborter, setLastRequestAborter] = useState<AbortController | null>(null);

    const proxy: TWatches = {
        protocol: useWatch({ control, name: protocol }),
        ip: useWatch({ control, name: ipAddress }),
        port: useWatch({ control, name: port }),
        user: useWatch({ control, name: user }),
        pass: useWatch({ control, name: pass }),
    };

    useEffect(() => {
        if (!proxy.ip || !proxy.port || !proxy.user || !proxy.pass) {
            return;
        }

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
