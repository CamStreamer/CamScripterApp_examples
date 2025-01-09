import { StyledForm, StyledRow } from '../../components/FormInputs';
import { StationEventTrigger } from './StationEventTrigger';
import { CameraStationSettings } from './CameraStationSettings';
import { FormHelperText, Link } from '@mui/material';

export const StationSettings = () => {
    return (
        <StyledForm>
            <FormHelperText>
                To run external data on the Axis Camera Station (ACS), you need to edit the registry on the computer
                where ACS is installed using{' '}
                <Link href="https://drive.google.com/file/d/176uMtC1goF4kBEFtx0IBMrZ5coo_zPeN/view" target="_blank">
                    this
                </Link>{' '}
                guide (or use the provided{' '}
                <Link href="https://camstreamer.com/acsregistery" target="_blank">
                    file
                </Link>
                ). Then, create a new source in Devices &#62; External data sources. Use the generated Source key in the
                settings below. To search for external data in ACS, click the + button, select &#39;Data search&#39;,
                and set the first filter to the value &#39;Live&#39;.
            </FormHelperText>
            <StyledRow>
                <CameraStationSettings />
                <StationEventTrigger />
            </StyledRow>
        </StyledForm>
    );
};
