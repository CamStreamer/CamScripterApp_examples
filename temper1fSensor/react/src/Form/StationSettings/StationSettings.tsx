import { Grid, FormHelperText, Link } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { StationEventTrigger } from './StationEventTrigger';
import { CameraStationSettings } from './CameraStationSettings';

export const StationSettings = () => {
    return (
        <StyledGrid container>
            <StyledFormHelperText>
                To run external data on the Axis Camera Station (ACS), you need to edit the registry on the computer
                where ACS is installed using{' '}
                <Link href="https://drive.google.com/file/d/176uMtC1goF4kBEFtx0IBMrZ5coo_zPeN/view" target="_blank">
                    this
                </Link>{' '}
                guide (or use the provided{' '}
                <Link href="https://drive.google.com/file/d/10Novidd_ZpbYUFQUtcV1RLXKUxyPFg-n/view" target="_blank">
                    file
                </Link>
                ). Then, create a new source in Devices &#62; External data sources. Use the generated Source key in the
                settings below. To search for external data in ACS, click the + button, select &#39;Data search&#39;,
                and set the first filter to the value &#39;Live&#39;.
            </StyledFormHelperText>
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

const StyledFormHelperText = styled(FormHelperText)`
    margin-bottom: 8px;
`;
