import { useState, useRef, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { TWatches } from '../utils';

type Props = {
    protocol: string;
    ipAddress: string;
    port: string;
    areCredentialsValid: boolean;
    credentials: string[];
};

export const useCheckConnection = ({ protocol, ipAddress, port, areCredentialsValid, credentials }: Props) => {
    const { getValues, control } = useFormContext();
    const fetchIdsInProgress = useRef<number[]>([]);
    const abortControllers = useRef<AbortController | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [cameraResponse, setCameraResponse] = useState<boolean | null>(null);

    const inputs: TWatches = {
        protocol: useWatch({ control, name: protocol }),
        ip: useWatch({ control, name: ipAddress }),
        port: useWatch({ control, name: port }),
        user: useWatch({ control, name: credentials[0] }),
        pass: useWatch({ control, name: credentials[1] }),
    };

    const isDisabled = !inputs.user || !inputs.pass || !inputs.ip || !inputs.protocol || !inputs.port;

    const getStatus = (): number => {
        if (isDisabled) {
            return 0;
        }
        if (isLoading) {
            return 1;
        } else {
            return cameraResponse ? 2 : 3;
        }
    };

    const handleCheck = async () => {
        if (!areCredentialsValid) {
            setCameraResponse(false);
            return;
        }

        const fetchId = Math.round(Math.random() * 10000);
        fetchIdsInProgress.current.push(fetchId);

        setIsLoading(true);

        try {
            const req = new Request(window.location.origin + '/local/camscripter/proxy.cgi', {
                headers: {
                    'x-target-camera-protocol': `${getValues(protocol)}`,
                    'x-target-camera-ip': `${getValues(ipAddress)}`,
                    'x-target-camera-port': `${getValues(port)}`,
                    'x-target-camera-user': `${encodeURIComponent(getValues(credentials[0]))}`,
                    'x-target-camera-pass': `${encodeURIComponent(getValues(credentials[1]))}`,
                    'x-target-camera-path': '/axis-cgi/basicdeviceinfo.cgi',
                },
            });

            if (fetchId !== fetchIdsInProgress.current[fetchIdsInProgress.current.length - 1]) {
                return;
            }

            const res = await fetch(req);
            setCameraResponse(res.ok);
        } catch (e) {
            console.error(e);
            setCameraResponse(false);
        } finally {
            fetchIdsInProgress.current = fetchIdsInProgress.current.filter((id) => fetchId !== id);
            abortControllers.current = null;
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void handleCheck();
    }, [areCredentialsValid]);

    const getLabelText = () => {
        switch (getStatus()) {
            case 0: {
                return 'No credentials';
            }
            case 1: {
                return 'Checking...';
            }
            case 2: {
                return 'Successful';
            }
            case 3: {
                return 'Failed';
            }
            default: {
                return 'No credentials';
            }
        }
    };

    const getChipClass = () => {
        switch (getStatus()) {
            case 0:
            case 1:
                return 'default';
            case 2:
                return 'success';
            case 3:
                return 'error';
        }
    };

    return [handleCheck, isDisabled, getLabelText, getChipClass] as const;
};
