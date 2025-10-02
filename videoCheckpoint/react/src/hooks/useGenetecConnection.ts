import { useFormContext, useWatch } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { areValuesInList, generateParams } from '../utils';
import { TSnackData } from './useSnackbar';

export type TCameraListOption = {
    index: number;
    value: string;
    label: string;
};

type TGenetec = {
    protocol: string;
    ip: string;
    port: number;
    base_uri: string;
    app_id: string;
    user: string;
    pass: string;
};

type Props = {
    displaySnackbar: (data: TSnackData) => void;
};

export const useGenetecConnection = ({ displaySnackbar }: Props) => {
    const { control, formState, setValue } = useFormContext();
    const [isConnected, setIsConnected] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [cameraList, setCameraList] = useState<TCameraListOption[]>();
    const [serverRunning, setServerRunning] = useState(false);

    const proxy: TGenetec = {
        protocol: useWatch({ control, name: `genetec.protocol` }),
        ip: useWatch({ control, name: `genetec.ip` }),
        port: useWatch({ control, name: `genetec.port` }),
        base_uri: useWatch({ control, name: `genetec.base_uri` }),
        app_id: useWatch({ control, name: `genetec.app_id` }),
        user: useWatch({ control, name: `genetec.user` }),
        pass: useWatch({ control, name: `genetec.pass` }),
    };

    const selectedCameras = useWatch({ control, name: 'genetec.camera_list' });

    const isDisabled = !proxy.ip || !proxy.port || !proxy.base_uri || !proxy.app_id || !proxy.user || !proxy.pass;

    const handleCheckConnection = async () => {
        setIsFetching(true);
        const isConnectedResponse = await fetch(
            `/local/camscripter/proxy/video_checkpoint/genetec/checkConnection?${generateParams(proxy)}`
        );

        void handleFetchCameraList();

        setIsConnected(isConnectedResponse.status === 200);
        setIsFetching(false);
    };

    const handleFetchCameraList = async () => {
        const cameraListResponse: TCameraListOption[] = await fetch(
            `/local/camscripter/proxy/video_checkpoint/genetec/getCameraList?${generateParams(proxy)}`
        ).then((res) => res.json());

        if (!areValuesInList(selectedCameras, cameraListResponse)) {
            const filtered = selectedCameras.filter((v: string) => cameraListResponse.find((o) => o.value === v));
            setValue('genetec.camera_list', filtered);
        }

        setCameraList(cameraListResponse);
    };

    const handleSendTestBookmark = async () => {
        const isSent = await fetch(
            `/local/camscripter/proxy/video_checkpoint/genetec/sendTestBookmark?${generateParams(
                proxy
            )}&camera_list=${JSON.stringify(selectedCameras)}`,
            {
                method: 'POST',
            }
        );
        if (isSent.status === 200) {
            displaySnackbar({
                type: 'success',
                message: 'Test message sent.',
            });
        }
    };

    const checkServerRunning = async () => {
        const response = await fetch(`/local/camscripter/proxy/video_checkpoint/genetec/serverRunCheck`);

        if (response.status === 200) {
            setIsFetching(false);
            setServerRunning(true);
            void handleCheckConnection();
        } else {
            const timeoutId = setTimeout(() => {
                void checkServerRunning();
            }, 3000);
            return () => clearTimeout(timeoutId);
        }
    };

    useEffect(() => {
        if (!isDisabled) {
            setIsFetching(true);
            setServerRunning(false);
            void checkServerRunning();
        }
    }, [
        formState.submitCount,
        isDisabled,
        proxy.protocol,
        proxy.ip,
        proxy.port,
        proxy.base_uri,
        proxy.user,
        proxy.pass,
        proxy.app_id,
    ]);

    return [
        handleCheckConnection,
        handleSendTestBookmark,
        handleFetchCameraList,
        isConnected,
        isFetching,
        cameraList,
        serverRunning,
        isDisabled,
    ] as const;
};
