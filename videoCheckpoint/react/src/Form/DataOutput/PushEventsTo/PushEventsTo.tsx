import { StyledSection } from '../../../components/FormInputs';
import { FormControlLabel, Switch } from '@mui/material';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import { TServerData } from '../../../models/schema';
import { FormAxisCameraStation } from './FormAxisCameraStation';

export const PushEventsTo = () => {
    const { control } = useFormContext<TServerData>();
    const acsEnabled = useWatch({ control, name: 'acs.enabled' });

    return (
        <StyledSection>
            <Controller
                name="acs.enabled"
                control={control}
                render={({ field }) => (
                    <FormControlLabel
                        control={
                            <Switch
                                {...field}
                                checked={field.value}
                                onChange={(e, v) => {
                                    field.onChange(v);
                                }}
                            />
                        }
                        label={'Axis Camera Station'}
                    />
                )}
            />
            {acsEnabled && <FormAxisCameraStation />}
            <Controller
                name="axis_events.conn_hub"
                control={control}
                render={({ field }) => (
                    <FormControlLabel
                        control={
                            <Switch
                                {...field}
                                checked={field.value}
                                onChange={(e, v) => {
                                    field.onChange(v);
                                }}
                            />
                        }
                        label={'Source device of Barcode/QR code'}
                    />
                )}
            />
            <Controller
                name="axis_events.camera"
                control={control}
                render={({ field }) => (
                    <FormControlLabel
                        control={
                            <Switch
                                {...field}
                                checked={field.value}
                                onChange={(e, v) => {
                                    field.onChange(v);
                                }}
                            />
                        }
                        label={
                            <>
                                Source device of Image/Video
                                <br />
                                (CamScripter App must be running on this device)
                            </>
                        }
                    />
                )}
            />
            <FormControlLabel control={<Switch />} label={'Genetec'} />
            <FormControlLabel control={<Switch disabled />} label={'Milestone VMS'} />
            <FormControlLabel control={<Switch disabled />} label={'HTTPS'} />
        </StyledSection>
    );
};
