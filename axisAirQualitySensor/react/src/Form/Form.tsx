import Fade from '@mui/material/Fade';
import styled from '@mui/material/styles/styled';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';
import { GraphicsOutputSettings } from './GraphicsOutputSettings';
import { SourceCameraSettings } from './SourceCameraSettings';

export function Form() {
    return (
        <Fade in={true} timeout={1000}>
            <StyledForm>
                <CollapsibleFormSection label="Air Quality Monitor" defaultExpanded={true}>
                    <SourceCameraSettings />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="Camoverlay app integration" defaultExpanded={true}>
                    <GraphicsOutputSettings />
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
