import { useEffect } from 'react';
import { TServerData } from '../../models/schema';
import { useFormContext } from 'react-hook-form';
import { StyledSection } from '../../components/FormInputs';
import { CollapsibleFormSection } from '../../components/CollapsibleFormSection';
import { DevicesForGraphicsOutput } from './DevicesForGraphicsOutput/DevicesForGraphicsOutput';
import { LedIndication } from './LedIndication';
import { UploadImageConfiguration } from './UploadImageConfiguration';
import { UploadVideoConfiguration } from './UploadVideoConfiguration';
import { UploadMediaTo } from './UploadMediaTo';
import { PushEventsTo } from './PushEventsTo';
import { useInitializeOnMount } from '../../hooks/useInitializeOnMount';
import { useResolutionList } from '../../hooks/useResolutionList';
import { useCameraList } from '../../hooks/useCameraList';

export const DataOutput = () => {
    const { watch } = useFormContext<TServerData>();
    const [viewAreaList, fetchCameraList] = useCameraList({
        name: 'camera',
    });
    const [resolutionOptions, fetchResolutionList] = useResolutionList({
        name: 'camera',
    });

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
        <StyledSection>
            {/* ------DEVICES FOR GRAPHICS OUTPUT------*/}
            <CollapsibleFormSection label="Devices for graphics output" defaultExpanded={true}>
                <DevicesForGraphicsOutput />
            </CollapsibleFormSection>

            {/* ------LED INDICATION------*/}
            <CollapsibleFormSection label="LED indication" defaultExpanded={true}>
                <LedIndication />
            </CollapsibleFormSection>

            {/* ------UPLOAD IMAGE CONFIGURATION------*/}
            <CollapsibleFormSection label="Upload image configuration" defaultExpanded={true}>
                <UploadImageConfiguration viewAreaList={viewAreaList} resolutionOptions={resolutionOptions} />
            </CollapsibleFormSection>

            {/* ------UPLOAD VIDEO CONFIGURATION------*/}
            <CollapsibleFormSection label="Upload video configuration" defaultExpanded={true}>
                <UploadVideoConfiguration viewAreaList={viewAreaList} />
            </CollapsibleFormSection>

            {/* ------UPLOAD MEDIA TO------*/}
            <CollapsibleFormSection label="Upload media to" defaultExpanded={true}>
                <UploadMediaTo />
            </CollapsibleFormSection>

            {/* ------PUSH EVENTS TO------*/}
            <CollapsibleFormSection label="Push events to" defaultExpanded={true}>
                <PushEventsTo />
            </CollapsibleFormSection>
        </StyledSection>
    );
};
