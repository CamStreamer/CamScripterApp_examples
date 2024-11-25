import { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

type Props = {
    protocol: string;
    ipAddress: string;
    port: string;
    areCredentialsValid: boolean;
    credentials: string[];
};

export const useCheckConnection = ({ protocol, ipAddress, port, areCredentialsValid, credentials }: Props) => {
    const { getValues } = useFormContext();
    const fetchIdsInProgress = useRef<number[]>([]);
    const abortControllers = useRef<AbortController | null>(null);
    const [cameraResponse, setCameraResponse] = useState<boolean | null>(null);
    const [status, setStatus] = useState<number | null>(null);
    const [disabled, setDisabled] = useState(false);

    const handleCheck = async () => {
        const fetchId = Math.round(Math.random() * 10000);
        fetchIdsInProgress.current.push(fetchId);

        setStatus(1);
        setDisabled(true);

        try {
            const req = new Request(window.location.origin + '/local/camscripter/proxy.cgi', {
                headers: {
                    'x-target-camera-protocol': `${getValues(protocol)}`,
                    'x-target-camera-ip': `${getValues(ipAddress)}`,
                    'x-target-camera-port': `${getValues(port)}`,
                    'x-target-camera-user': `${getValues(credentials[0])}`,
                    'x-target-camera-pass': `${getValues(credentials[1])}`,
                    'x-target-camera-path': '/axis-cgi/basicdeviceinfo.cgi',
                },
            });

            if (fetchId !== fetchIdsInProgress.current[fetchIdsInProgress.current.length - 1]) {
                return;
            }

            if (areCredentialsValid) {
                const res = await fetch(req);

                if (res.ok) {
                    setCameraResponse(true);
                    setStatus(2);
                } else {
                    setCameraResponse(false);
                    setStatus(3);
                }
            } else {
                setCameraResponse(false);
                setStatus(3);
            }
        } catch (e) {
            console.error(e);
            setCameraResponse(false);
            setStatus(3);
        } finally {
            fetchIdsInProgress.current = fetchIdsInProgress.current.filter((id) => fetchId !== id);
            abortControllers.current = null;
            setDisabled(false);
        }
    };

    useEffect(() => {
        if (
            getValues(credentials[0]).length === 0 ||
            getValues(credentials[1]).length === 0 ||
            getValues(ipAddress).length === 0
        ) {
            setStatus(0);
            setDisabled(true);
        } else if (getValues(credentials[0]) && getValues(credentials[1]) && getValues(ipAddress)) {
            setStatus(1);
            setDisabled(true);
            const debounceTimeout = setTimeout(() => {
                handleCheck();
            }, 300);

            return () => clearTimeout(debounceTimeout);
        } else if (areCredentialsValid && cameraResponse) {
            setStatus(2);
        } else if (cameraResponse !== null) {
            setStatus(3);
        }
    }, [areCredentialsValid, cameraResponse, credentials, ipAddress, getValues]);

    useEffect(() => {
        setCameraResponse(null);
    }, [credentials]);

    const getLabelText = () => {
        switch (status) {
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
                return 'Check';
            }
        }
    };

    const getChipClass = () => {
        switch (status) {
            case 0:
            case 1:
            case 4:
                return 'default';
            case 2:
                return 'success';
            case 3:
                return 'error';
        }
    };

    return [handleCheck, disabled, getLabelText, getChipClass] as const;
};
