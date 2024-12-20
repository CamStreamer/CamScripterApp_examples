import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledSelect } from '../../components/FormInputs';
import { FormFloatInput } from '../../components/FormFloatInput';
import { Title } from '../../components/Title';
import { Stack, MenuItem, FormControlLabel, Switch, InputAdornment, FormHelperText } from '@mui/material';
import { TAppSchema } from '../../models/schema';
import { EVENT_DELAYS_LABELS, EVENT_DELAYS, WHEN_LABELS, WHEN } from '../constants';

export const StationEventTrigger = () => {
    const { control, watch } = useFormContext<TAppSchema>();
    const unit = watch('unit');

    return (
        <Stack spacing={1.5}>
            <Title text="Event Trigger" />
            {/* ------SWITCH------*/}
            <Controller
                name={`acs_active`}
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
                name={`acs_condition_delay`}
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
                name={`acs_condition_operator`}
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
            <FormFloatInput control={control} name={`acs_condition_value`} unit={unit} />
            {/* ------REPEAT AFTER TIME------*/}
            <Controller
                name={`acs_repeat_after`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="Repeat after time"
                        onChange={(e) => {
                            const val = parseValueAsInt(e.target.value);
                            field.onChange(val);
                        }}
                        error={formState.errors.acs_repeat_after !== undefined}
                        helperText={formState.errors.acs_repeat_after?.message}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">s</InputAdornment>,
                        }}
                    />
                )}
            />
            <FormHelperText>Set to zero for non-repetition.</FormHelperText>
        </Stack>
    );
};
