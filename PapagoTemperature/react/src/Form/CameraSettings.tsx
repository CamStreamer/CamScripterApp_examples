import Grid from '@mui/material/Grid';
import { CameraConnectParams } from './CameraConnectParams';
import { CustomGraphicsSettings } from './CustomGraphicsSettings';

export const CameraSettings = () => {
    return (
        <Grid container>
            <Grid item md={6} xs={12}>
                <CameraConnectParams name="camera" />
            </Grid>
            <Grid item md={6} xs={12}>
                <CustomGraphicsSettings />
            </Grid>
        </Grid>
    );
};
