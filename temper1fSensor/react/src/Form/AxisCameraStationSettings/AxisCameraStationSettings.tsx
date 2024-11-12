import { Grid } from '@mui/material';
import { AxisCameraEventTrigger } from './AxisCameraEventTrigger';
import { CameraStationSettings } from './CameraStationSettings';

export const AxisCameraStationSettings = () => {
  return (
    <Grid container>
      <Grid item md={6} xs={12}>
        <CameraStationSettings />
      </Grid>
      <Grid item md={6} xs={12}>
        <AxisCameraEventTrigger />
      </Grid>
    </Grid>
  );
};
