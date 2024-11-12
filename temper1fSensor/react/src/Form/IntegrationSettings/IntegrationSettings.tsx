import { Grid } from '@mui/material';
import { IntegrationCameraSettings } from './IntegrationCameraSettings';
import { WidgetSettings } from './WidgetSettings';

export const IntegrationSettings = () => {
  return (
    <Grid container>
      <Grid item md={6} xs={12}>
        <IntegrationCameraSettings />
      </Grid>
      <Grid item md={6} xs={12}>
        <WidgetSettings />
      </Grid>
    </Grid>
  );
};
