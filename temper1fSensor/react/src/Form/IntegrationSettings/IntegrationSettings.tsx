import { Grid } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { IntegrationCameraSettings } from './IntegrationCameraSettings';
import { WidgetSettings } from './WidgetSettings';
import { useCameraList } from '../../hooks/useCameraList';
import { useInitializeOnMount } from '../../hooks/useInitializeOnMount';

export const IntegrationSettings = () => {
    const [viewAreaList, fetchCameraList] = useCameraList();

    useInitializeOnMount(() => {
        fetchCameraList({
            camera_list: 'camera_list',
            protocol: 'camera_protocol',
            ipAddress: 'camera_ip',
            port: 'camera_port',
            user: 'camera_user',
            pass: 'camera_pass',
        });
    });
    return (
        <StyledGrid container>
            <Grid item md={6} xs={12}>
                <IntegrationCameraSettings viewAreaList={viewAreaList} />
            </Grid>
            <Grid item md={6} xs={12}>
                <WidgetSettings />
            </Grid>
        </StyledGrid>
    );
};

const StyledGrid = styled(Grid)`
    margin-bottom: 15px;
`;
