import { Grid } from '@mui/material';
import { EventsDeviceSettings } from './EventsDeviceSettings';
import { EventTrigger } from './EventTrigger';

export const EventsSettings = () => {
    return (
        <Grid container>
            <Grid item md={6} xs={12}>
                <EventsDeviceSettings />
            </Grid>
            <Grid item md={6} xs={12}>
                <EventTrigger />
            </Grid>
        </Grid>
    );
};
