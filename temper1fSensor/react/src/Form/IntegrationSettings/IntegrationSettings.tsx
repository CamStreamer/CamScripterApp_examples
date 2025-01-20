import { Grid, FormHelperText, Link } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { IntegrationDeviceSettings } from './IntegrationDeviceSettings';
import { WidgetSettings } from './WidgetSettings';

export const IntegrationSettings = () => {
    return (
        <StyledGrid container>
            <StyledFormHelperText>
                To quickly set up the CamOverlay App, import this{' '}
                <Link
                    href="https://drive.google.com/file/d/11egz7D8l6KSZOO6XHZtcHBrEGZhKt3RG/view?usp=sharing"
                    target="_blank"
                >
                    file
                </Link>{' '}
                into the CamOverlay App in the Settings section.
            </StyledFormHelperText>
            <Grid item md={6} xs={12}>
                <IntegrationDeviceSettings />
            </Grid>
            <Grid item md={6} xs={12}>
                <WidgetSettings />
            </Grid>
        </StyledGrid>
    );
};

const StyledGrid = styled(Grid)`
    margin-bottom: 15px;
`;

const StyledFormHelperText = styled(FormHelperText)`
    margin-bottom: 8px;
`;
