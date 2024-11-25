import { Grid } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { IntegrationDeviceSettings } from './IntegrationDeviceSettings';
import { WidgetSettings } from './WidgetSettings';

export const IntegrationSettings = () => {
    return (
        <StyledGrid container>
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
