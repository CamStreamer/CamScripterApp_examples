import { useFormContext, useWatch } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { generateParams } from '../utils';

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
    displaySnackbar: (data: { type: 'error' | 'success'; message: string }) => void;
};

export const useGenetecConnection = ({ displaySnackbar }: Props) => {
    const { control, watch } = useFormContext();
    const [isConnected, setIsConnected] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [cameraList, setCameraList] = useState<TCameraListOption[]>();

    const proxy: TGenetec = {
        protocol: useWatch({ control, name: `genetec.protocol` }),
        ip: useWatch({ control, name: `genetec.ip` }),
        port: useWatch({ control, name: `genetec.port` }),
        base_uri: useWatch({ control, name: `genetec.base_uri` }),
        app_id: useWatch({ control, name: `genetec.app_id` }),
        user: useWatch({ control, name: `genetec.user` }),
        pass: useWatch({ control, name: `genetec.pass` }),
    };

    const selectedCameras = watch(`genetec.camera_list`);

    const handleCheckConnection = async () => {
        setIsFetching(true);
        const isConnectedResponse = await fetch(
            `/local/camscripter/package/proxy/video_checkpoint/genetec/checkConnection?${generateParams(proxy)}`
        );

        setIsConnected(isConnectedResponse.status === 200);
        setIsFetching(false);
    };

    const handleFetchCameraList = async () => {
        const cameraListResponse = await fetch(
            `/local/camscripter/package/proxy/video_checkpoint/genetec/getCameraList?${generateParams(proxy)}`
        ).then((res) => res.json());
        setCameraList(cameraListResponse);
    };

    const handleSendTestBookmark = async () => {
        const isSent = await fetch(
            `/local/camscripter/package/proxy/video_checkpoint/genetec/sendTestBookmark?${generateParams(
                proxy
            )}&camera_list=${JSON.stringify(cameraList)}&selected_cameras=${JSON.stringify(selectedCameras)}`,
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

    useEffect(() => {
        void handleCheckConnection();
        void handleFetchCameraList();
    }, [proxy.protocol, proxy.ip, proxy.port, proxy.base_uri, proxy.user, proxy.pass, proxy.app_id]);

    return [
        handleCheckConnection,
        handleFetchCameraList,
        handleSendTestBookmark,
        isConnected,
        isFetching,
        cameraList,
    ] as const;
};
