import Fade from "@mui/material/Fade";
import styled from "@mui/material/styles/styled";
import { CollapsibleFormSection } from "../components/CollapsibleFormSection";

import { ApplicationSettings } from "./ApplicationSettings";
import { CameraSettings } from "./CameraSettings";

export function Form() {
  return (
    <Fade in={true} timeout={1000}>
      <StyledForm>
        <CollapsibleFormSection label="Temperature settings" defaultExpanded={true}>
          <ApplicationSettings />
        </CollapsibleFormSection>
        <CollapsibleFormSection label="Camoverlay app integration" defaultExpanded={false}>
          <CameraSettings />
        </CollapsibleFormSection>
        <CollapsibleFormSection label="axis camera station" defaultExpanded={false}>
          <CameraSettings />
        </CollapsibleFormSection>
        <CollapsibleFormSection label="axis camera events" defaultExpanded={false}>
          <CameraSettings />
        </CollapsibleFormSection>
      </StyledForm>
    </Fade>
  );
}

const StyledForm = styled("div")`
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: column;
`;
