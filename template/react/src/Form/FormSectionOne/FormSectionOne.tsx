import { Grid } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { LeftAppSettings } from './LeftAppSettings';
import { RightAppSettings } from './RightAppSettings';

export const FormSectionOne = () => {
    return (
        <StyledGrid container>
            <Grid item md={6} xs={12}>
                <LeftAppSettings name="application" />
            </Grid>
            <Grid item md={6} xs={12}>
                <RightAppSettings name="application" />
            </Grid>
        </StyledGrid>
    );
};

const StyledGrid = styled(Grid)`
    margin-bottom: 15px;
`;
