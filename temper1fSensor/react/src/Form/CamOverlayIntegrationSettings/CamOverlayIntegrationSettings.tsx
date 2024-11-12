import { Grid } from '@mui/material';
import { CamOverlayCameraSettings } from './CamOverlayCameraSettings';
import { WidgetSettings } from './WidgetSettings';

export const CamOverlayIntegrationSettings = () => {
  return (
    <Grid container>
      <Grid item md={6} xs={12}>
        <CamOverlayCameraSettings />
      </Grid>
      <Grid item md={6} xs={12}>
        <WidgetSettings />
      </Grid>
    </Grid>
  );
};
