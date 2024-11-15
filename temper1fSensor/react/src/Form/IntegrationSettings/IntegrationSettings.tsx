import { Grid } from '@mui/material';
import { IntegrationCameraSettings } from './IntegrationCameraSettings';
import { WidgetSettings } from './WidgetSettings';
import { useCameraList } from '../../hooks/useCameraList';
import { useInitializeOnMount } from '../../hooks/useInitializeOnMount';

export const IntegrationSettings = () => {
    const [viewAreaList, fetchCameraList] = useCameraList();

    useInitializeOnMount(() => {
        fetchCameraList({
            view_areas: 'view_areas',
            protocol: 'camera_protocol',
            ipAddress: 'camera_ip',
            port: 'camera_port',
            user: 'camera_user',
            pass: 'camera_pass',
        });
    });
    return (
        <Grid container>
            <Grid item md={6} xs={12}>
                <IntegrationCameraSettings viewAreaList={viewAreaList} />
            </Grid>
            <Grid item md={6} xs={12}>
                <WidgetSettings />
            </Grid>
        </Grid>
    );
};
