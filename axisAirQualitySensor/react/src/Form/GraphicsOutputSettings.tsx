import { TServerData } from '../models/schema';
import { useFormContext } from 'react-hook-form';
import { useCameraList } from '../hooks/useCameraList';
import { useInitializeOnMount } from '../hooks/useInitializeOnMount';
import { useResolutionList } from '../hooks/useResolutionList';
import { StyledRow } from '../components/FormInputs';
import { OutputCameraSettings } from './OutputCameraSettings';
import { WidgetSettings } from './WidgetSettings';
import { useEffect } from 'react';

export const GraphicsOutputSettings = () => {
    const { watch } = useFormContext<TServerData>();
    const [viewAreaList, fetchCameraList] = useCameraList({
        name: 'output_camera',
    });
    const [resolutionOptions, fetchResolutionList] = useResolutionList({
        name: 'output_camera',
    });

    const inputProtocol = watch('output_camera.protocol');
    const inputIP = watch('output_camera.ip');
    const inputPort = watch('output_camera.port');
    const inputUser = watch('output_camera.user');
    const inputPass = watch('output_camera.pass');

    useInitializeOnMount(() => {
        void fetchCameraList();
        void fetchResolutionList();
    });

    useEffect(() => {
        if (inputIP.length > 0 && inputUser.length > 0 && inputPass.length > 0) {
            const debounceTimeout = setTimeout(() => {
                void fetchCameraList();
                void fetchResolutionList();
            }, 300);

            return () => clearTimeout(debounceTimeout);
        }
    }, [inputProtocol, inputIP, inputPort, inputUser, inputPass]);

    return (
        <StyledRow>
            <OutputCameraSettings viewAreaList={viewAreaList} />
            <WidgetSettings resolutionOptions={resolutionOptions} />
        </StyledRow>
    );
};
