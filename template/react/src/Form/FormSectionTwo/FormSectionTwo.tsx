import { Grid } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { LeftCamSettings } from './LeftCamSettings';
import { RightCamSettings } from './RightCamSettings';

export const FormSectionTwo = () => {
    return (
        <StyledGrid container>
            <Grid item md={6} xs={12}>
                <LeftCamSettings name="camera" />
            </Grid>
            <Grid item md={6} xs={12}>
                <RightCamSettings name="camera" />
            </Grid>
        </StyledGrid>
    );
};

const StyledGrid = styled(Grid)`
    margin-bottom: 15px;
`;
