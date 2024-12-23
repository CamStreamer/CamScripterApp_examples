import { Controller, useFormContext } from 'react-hook-form';
import { StyledSelect, StyledForm } from '../../components/FormInputs';
import { FormFloatInput } from '../../components/FormFloatInput';
import { Title } from '../../components/Title';
import { MenuItem, FormControlLabel, Switch } from '@mui/material';
import { TAppSchema } from '../../models/schema';
import { EVENT_DELAYS_LABELS, EVENT_DELAYS, WHEN_LABELS, WHEN } from '../constants';

export const EventTrigger = () => {
    const { control } = useFormContext<TAppSchema>();

    return (
        <StyledForm>
            <Title text="Event Trigger" />
            {/* ------SWITCH------*/}
            <Controller
                name={`event_camera.active`}
                control={control}
                render={({ field }) => (
                    <FormControlLabel
                        {...field}
                        control={<Switch checked={field?.value} color="info" />}
                        label="Active"
                    />
                )}
            />
            {/* ------TRIGGERED------*/}
            <Controller
                name={`event_camera.condition_delay`}
                control={control}
                render={({ field }) => (
                    <StyledSelect {...field} label="Triggered">
                        {EVENT_DELAYS.map((value) => (
                            <MenuItem key={value} value={value}>
                                {EVENT_DELAYS_LABELS[value]}
                            </MenuItem>
                        ))}
                    </StyledSelect>
                )}
            />
            {/* ------WHEN------*/}
            <Controller
                name={`event_camera.condition_operator`}
                control={control}
                render={({ field }) => (
                    <StyledSelect {...field} label="When">
                        {WHEN.map((value) => (
                            <MenuItem key={value} value={value}>
                                {WHEN_LABELS[value]}
                            </MenuItem>
                        ))}
                    </StyledSelect>
                )}
            />
            {/* ------VALUE------*/}
            <FormFloatInput control={control} name={`event_camera.condition_value`} />
        </StyledForm>
    );
};
