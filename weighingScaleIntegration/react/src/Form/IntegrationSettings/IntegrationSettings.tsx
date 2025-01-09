import { StyledForm, StyledRow } from './../../components/FormInputs';
import { IntegrationDeviceSettings } from './IntegrationDeviceSettings';
import { WidgetSettings } from './WidgetSettings';
import { Link, FormHelperText } from '@mui/material';

export const IntegrationSettings = () => {
    return (
        <StyledForm>
            <FormHelperText>
                To quickly set up the CamOverlay App, import this{' '}
                <Link href="https://drive.google.com/file/d/11KPsROnp6mynNevVX2jDehbNXLZodolN/view" target="_blank">
                    file
                </Link>{' '}
                into the CamOverlay App in the Settings section.
            </FormHelperText>
            <StyledRow>
                <IntegrationDeviceSettings />
                <WidgetSettings />
            </StyledRow>
        </StyledForm>
    );
};
