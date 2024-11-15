import Fade from '@mui/material/Fade';
import styled from '@mui/material/styles/styled';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';

import { TemperatureSettings } from './TemperatureSettings';
import { IntegrationSettings } from './IntegrationSettings/IntegrationSettings';
import { StationSettings } from './StationSettings/StationSettings';
import { EventsSettings } from './EventsSettings/EventsSettings';

export function Form() {
    return (
        <Fade in={true} timeout={1000}>
            <StyledForm>
                <CollapsibleFormSection label="Temperature settings" defaultExpanded={true}>
                    <TemperatureSettings />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="Camoverlay app integration" defaultExpanded={false}>
                    <IntegrationSettings />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="axis camera station" defaultExpanded={false}>
                    <StationSettings />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="axis camera events" defaultExpanded={false}>
                    <EventsSettings />
                </CollapsibleFormSection>
            </StyledForm>
        </Fade>
    );
}

const StyledForm = styled('div')`
    width: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding: 0 20px;
    margin-top: 20px;
`;
