import { Grid } from '@mui/material';
import { EventsCameraSettings } from './EventsCameraSettings';
import { EventTrigger } from './EventTrigger';

export const EventsSettings = () => {
    return (
        <Grid container>
            <Grid item md={6} xs={12}>
                <EventsCameraSettings />
            </Grid>
            <Grid item md={6} xs={12}>
                <EventTrigger />
            </Grid>
        </Grid>
    );
};
