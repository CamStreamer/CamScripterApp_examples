import { TSettings } from '../models/schema';
import { useFormContext } from 'react-hook-form';
import { useCameraList } from '../hooks/useCameraList';
import { useInitializeOnMount } from '../hooks/useInitializeOnMount';
import { useResolutionList } from '../hooks/useResolutionList';
import { StyledRow } from '../components/FormInputs';
import { OutputCameraSettings } from './OutputCameraSettings';
import { WidgetSettings } from './WidgetSettings';
import { useEffect } from 'react';

export const GraphicsOutputSettings = () => {
    const { watch } = useFormContext<TSettings>();
    const [viewAreaList, fetchCameraList] = useCameraList();
    const [resolutionOptions, fetchResolutionList] = useResolutionList();

    const inputIP = watch('camera_ip');
    const inputPort = watch('camera_port');
    const inputUser = watch('camera_user');
    const inputPass = watch('camera_pass');

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
    }, [inputIP, inputPort, inputUser, inputPass]);

    return (
        <StyledRow>
            <OutputCameraSettings viewAreaList={viewAreaList} />
            <WidgetSettings resolutionOptions={resolutionOptions} />
        </StyledRow>
    );
};
