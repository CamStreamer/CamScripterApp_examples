import { Grid } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { StationEventTrigger } from './StationEventTrigger';
import { CameraStationSettings } from './CameraStationSettings';

export const StationSettings = () => {
    return (
        <StyledGrid container>
            <Grid item md={6} xs={12}>
                <CameraStationSettings />
            </Grid>
            <Grid item md={6} xs={12}>
                <StationEventTrigger />
            </Grid>
        </StyledGrid>
    );
};

const StyledGrid = styled(Grid)`
    margin-bottom: 15px;
`;
