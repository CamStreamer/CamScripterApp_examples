import { TSettingsSchema } from '../../models/schema';
import { useFormContext } from 'react-hook-form';
import { useCameraList } from '../../hooks/useCameraList';
import { useInitializeOnMount } from '../../hooks/useInitializeOnMount';
import { useResolutionList } from '../../hooks/useResolutionList';
import { StyledRow } from '../../components/FormInputs';
import { ConnectionSettings } from './ConnectionSettings';
import { GraphicsSettings } from './GraphicsSettings';
import { useEffect } from 'react';

export const CamOverlayIntegration = () => {
    const { watch } = useFormContext<TSettingsSchema>();
    const [viewAreaList, fetchCameraList] = useCameraList();
    const [resolutionOptions, fetchResolutionList] = useResolutionList();

    const inputProtocol = watch('camera.protocol');
    const inputIP = watch('camera.ip');
    const inputPort = watch('camera.port');
    const inputUser = watch('camera.user');
    const inputPass = watch('camera.pass');

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
            <ConnectionSettings viewAreaList={viewAreaList} />
            <GraphicsSettings resolutionOptions={resolutionOptions} />
        </StyledRow>
    );
};
