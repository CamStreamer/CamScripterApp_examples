import { Controller, useFormContext } from 'react-hook-form';
import { StyledSelect } from '../../components/FormInputs';
import { FormFloatInput } from '../../components/FormFloatInput';
import { Title } from '../../components/Title';
import { Stack, MenuItem, FormControlLabel, Switch } from '@mui/material';
import { TAppSchema } from '../../models/schema';
import { EVENT_DELAYS_LABELS, EVENT_DELAYS, WHEN_LABELS, WHEN } from '../constants';

export const EventTrigger = () => {
    const { control, watch } = useFormContext<TAppSchema>();
    const unit = watch('unit');

    return (
        <Stack spacing={1.5}>
            <Title text="Event Trigger" />
            {/* ------SWITCH------*/}
            <Controller
                name={`event_active`}
                control={control}
                render={({ field }) => (
                    <FormControlLabel
                        {...field}
                        control={<Switch checked={field.value} color="info" />}
                        label="Active"
                    />
                )}
            />
            {/* ------TRIGGERED------*/}
            <Controller
                name={`event_condition_delay`}
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
                name={`event_condition_operator`}
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
            <FormFloatInput control={control} name={`event_condition_value`} unit={unit} />
        </Stack>
    );
};
