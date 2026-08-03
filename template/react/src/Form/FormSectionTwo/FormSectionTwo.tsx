import { StyledForm, StyledRow } from '../../components/FormInputs';
import { LeftCamSettings } from './LeftCamSettings';
import { RightCamSettings } from './RightCamSettings';

export const FormSectionTwo = () => {
    return (
        <StyledForm>
            <StyledRow>
                <LeftCamSettings />
                <RightCamSettings />
            </StyledRow>
        </StyledForm>
    );
};
