import Fade from '@mui/material/Fade';
import styled from '@mui/material/styles/styled';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';
import { DevicesForGraphicsOutput } from './DevicesForGraphicsOutput';
import { FormConnectParams } from './FormConnectParams';

export function Form() {
    return (
        <Fade in={true} timeout={1000}>
            <StyledForm>
                <CollapsibleFormSection label="Source of Air Quality data" defaultExpanded={true}>
                    <FormConnectParams name={'conn_hub'} />
                </CollapsibleFormSection>
                <CollapsibleFormSection label="Devices for graphics output" defaultExpanded={true}>
                    <DevicesForGraphicsOutput />
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
    border: 1px solid red;
`;
