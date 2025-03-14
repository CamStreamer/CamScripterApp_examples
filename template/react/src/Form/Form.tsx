import { Fade } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';

import { FormSectionOne } from './FormSectionOne/FormSectionOne';
import { FormSectionTwo } from './FormSectionTwo/FormSectionTwo';

export function Form() {
    return (
        <Fade in={true} timeout={1000}>
            <StyledForm>
                <CollapsibleFormSection label="Data source" defaultExpanded={true}>
                    <FormSectionOne />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="Data output" defaultExpanded={false}>
                    <FormSectionTwo />
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
    margin-top: 20px;
    gap: 8px;
`;
