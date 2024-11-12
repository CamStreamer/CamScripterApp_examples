import Fade from '@mui/material/Fade';
import styled from '@mui/material/styles/styled';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';

import { TemperatureSettings } from './TemperatureSettings';
import { CamOverlayIntegrationSettings } from './CamOverlayIntegrationSettings/CamOverlayIntegrationSettings';
import { AxisCameraStationSettings } from './AxisCameraStationSettings/AxisCameraStationSettings';
import { CameraEventsSettings } from './CameraEventsSettings/CameraEventsSettings';

export function Form() {
  return (
    <Fade in={true} timeout={1000}>
      <StyledForm>
        <CollapsibleFormSection
          label="Temperature settings"
          defaultExpanded={true}
        >
          <TemperatureSettings />
        </CollapsibleFormSection>
        <CollapsibleFormSection
          label="Camoverlay app integration"
          defaultExpanded={false}
        >
          <CamOverlayIntegrationSettings />
        </CollapsibleFormSection>
        <CollapsibleFormSection
          label="axis camera station"
          defaultExpanded={false}
        >
          <AxisCameraStationSettings />
        </CollapsibleFormSection>
        <CollapsibleFormSection
          label="axis camera events"
          defaultExpanded={false}
        >
          <CameraEventsSettings />
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
`;
