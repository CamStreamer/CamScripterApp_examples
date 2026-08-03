import { StyledForm, StyledRow } from '../../components/FormInputs';
import { LeftAppSettings } from './LeftAppSettings';
import { RightAppSettings } from './RightAppSettings';

export const FormSectionOne = () => {
    return (
        <StyledForm>
            <StyledRow>
                <LeftAppSettings />
                <RightAppSettings />
            </StyledRow>
        </StyledForm>
    );
};
