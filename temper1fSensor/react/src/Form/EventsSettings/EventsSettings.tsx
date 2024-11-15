import { Grid } from '@mui/material';
import { EventsCameraSettings } from './EventsCameraSettings';
import { EventTrigger } from './EventTrigger';
import { useCameraList } from '../../hooks/useCameraList';
import { useInitializeOnMount } from '../../hooks/useInitializeOnMount';

export const EventsSettings = () => {
    const [viewAreaList, fetchCameraList] = useCameraList();

    useInitializeOnMount(() => {
        fetchCameraList({
            view_areas: 'event_view_areas',
            protocol: 'event_camera_protocol',
            ipAddress: 'event_camera_ip',
            port: 'event_camera_port',
            user: 'event_camera_user',
            pass: 'event_camera_pass',
        });
    });

    return (
        <Grid container>
            <Grid item md={6} xs={12}>
                <EventsCameraSettings viewAreaList={viewAreaList} />
            </Grid>
            <Grid item md={6} xs={12}>
                <EventTrigger />
            </Grid>
        </Grid>
    );
};
