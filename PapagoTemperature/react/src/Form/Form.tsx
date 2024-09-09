import Fade from '@mui/material/Fade';
import styled from '@mui/material/styles/styled';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';

import { PapagoSettings } from './PapagoSettings';
import { CameraSettings } from './CameraSettings';

export function Form() {
    return (
        <Fade in={true} timeout={1000}>
            <StyledForm>
                <CollapsibleFormSection label="Data source" defaultExpanded={true}>
                    <PapagoSettings />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="Data output" defaultExpanded={false}>
                    <CameraSettings />
                </CollapsibleFormSection>
            </StyledForm>
        </Fade>
    );
}

const StyledForm = styled('div')({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
});
