import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledSelect, StyledForm } from '../../components/FormInputs';
import { FormFloatInput } from '../../components/FormFloatInput';
import { Title } from '../../components/Title';
import { MenuItem, FormControlLabel, Switch, InputAdornment, FormHelperText } from '@mui/material';
import { TAppSchema } from '../../models/schema';
import { EVENT_DELAYS_LABELS, EVENT_DELAYS, WHEN_LABELS, WHEN } from '../constants';

export const StationEventTrigger = () => {
    const { control } = useFormContext<TAppSchema>();

    return (
        <StyledForm>
            <Title text="Event Trigger" />
            {/* ------SWITCH------*/}
            <Controller
                name={`acs.active`}
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
                name={`acs.condition_delay`}
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
                name={`acs.condition_operator`}
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
            <FormFloatInput control={control} name={`acs.condition_value`} />
            {/* ------REPEAT AFTER TIME------*/}
            <Controller
                name={`acs.repeat_after`}
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
                        error={formState.errors.acs?.repeat_after !== undefined}
                        helperText={formState.errors.acs?.repeat_after?.message}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">s</InputAdornment>,
                        }}
                    />
                )}
            />
            <FormHelperText>Set to zero for non-repetition.</FormHelperText>
        </StyledForm>
    );
};
