import Fade from '@mui/material/Fade';
import styled from '@mui/material/styles/styled';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';

import { LanConverterSettings } from './LanConverterSettings/LanConverterSettings';
import { IntegrationSettings } from './IntegrationSettings/IntegrationSettings';
import { StationSettings } from './StationSettings/StationSettings';
import { EventsSettings } from './EventsSettings/EventsSettings';

export function Form() {
    return (
        <Fade in={true} timeout={1000}>
            <StyledForm>
                <CollapsibleFormSection label="RS232 Lan converter settings" defaultExpanded={true}>
                    <LanConverterSettings />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="Camoverlay app integration" defaultExpanded={false}>
                    <IntegrationSettings />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="Axis camera station integration" defaultExpanded={false}>
                    <StationSettings />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="Axis device events" defaultExpanded={false}>
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
