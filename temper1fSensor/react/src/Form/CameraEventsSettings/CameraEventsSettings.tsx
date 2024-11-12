import { Grid } from '@mui/material';
import { CameraSettings } from './CameraSettings';
import { EventTrigger } from './EventTrigger';

export const CameraEventsSettings = () => {
  return (
    <Grid container>
      <Grid item md={6} xs={12}>
        <CameraSettings />
      </Grid>
      <Grid item md={6} xs={12}>
        <EventTrigger />
      </Grid>
    </Grid>
  );
};
