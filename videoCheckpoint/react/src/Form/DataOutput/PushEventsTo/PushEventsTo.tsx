import { StyledSection } from '../../../components/FormInputs';
import { FormControlLabel, Switch } from '@mui/material';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import { TServerData } from '../../../models/schema';
import { FormAxisCameraStation } from './FormAxisCameraStation';
import { Genetec } from './Genetec';
import { Milestone } from './Milestone';

export const PushEventsTo = () => {
    const { control } = useFormContext<TServerData>();
    const acsEnabled = useWatch({ control, name: 'acs.enabled' });
    const genetecEnabled = useWatch({ control, name: 'genetec.enabled' });
    const milestoneEnabled = useWatch({ control, name: 'milestone.enabled' });

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
            <Controller
                name="genetec.enabled"
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
                        label={'Genetec VMS'}
                    />
                )}
            />
            {genetecEnabled && <Genetec />}
            <Controller
                name="milestone.enabled"
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
                        label={'Milestone VMS'}
                    />
                )}
            />
            {milestoneEnabled && <Milestone />}
            <FormControlLabel control={<Switch disabled />} label={'HTTPS'} />
        </StyledSection>
    );
};
