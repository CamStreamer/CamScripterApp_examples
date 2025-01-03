import { StyledRow } from '../../components/FormInputs';
import { EventsDeviceSettings } from './EventsDeviceSettings';
import { EventTrigger } from './EventTrigger';

export const EventsSettings = () => {
    return (
        <StyledRow>
            <EventsDeviceSettings />
            <EventTrigger />
        </StyledRow>
    );
};
