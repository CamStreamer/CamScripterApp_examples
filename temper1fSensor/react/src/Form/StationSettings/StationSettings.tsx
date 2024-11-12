import { Grid } from '@mui/material';
import { StationEventTrigger } from './StationEventTrigger';
import { CameraStationSettings } from './CameraStationSettings';

export const StationSettings = () => {
  return (
    <Grid container>
      <Grid item md={6} xs={12}>
        <CameraStationSettings />
      </Grid>
      <Grid item md={6} xs={12}>
        <StationEventTrigger />
      </Grid>
    </Grid>
  );
};
