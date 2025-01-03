import { StyledRow } from '../../components/FormInputs';
import { StationEventTrigger } from './StationEventTrigger';
import { CameraStationSettings } from './CameraStationSettings';

export const StationSettings = () => {
    return (
        <StyledRow>
            <CameraStationSettings />
            <StationEventTrigger />
        </StyledRow>
    );
};
