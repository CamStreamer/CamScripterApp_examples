import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledSelect } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import {
  Stack,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
} from '@mui/material';
import { TAppSchema } from '../../models/schema';
import {
  EVENT_DELAYS_LABELS,
  EVENT_DELAYS,
  WHEN_LABELS,
  WHEN,
} from '../constants';

export const EventTrigger = () => {
  const { control, watch } = useFormContext<TAppSchema>();
  const unit = watch('unit');

  return (
    <Stack spacing={1.5}>
      <Title text="Event Trigger" />
      {/*------SWITCH------*/}
      <Controller
        name={`event_active`}
        control={control}
        render={({ field }) => (
          <FormControlLabel
            {...field}
            control={<Switch checked={field.value} />}
            label="Active"
          />
        )}
      />
      {/*------TRIGGERED------*/}
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
      {/*------WHEN------*/}
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
      {/*------VALUE------*/}
      <Controller
        name={`event_condition_value`}
        control={control}
        render={({ field, formState }) => (
          <StyledTextField
            {...field}
            InputLabelProps={{ shrink: true }}
            fullWidth
            label="Value"
            onChange={(e) => {
              const val = parseValueAsInt(e.target.value);
              field.onChange(val);
              e.target.value = val.toString();
              field.onBlur();
            }}
            error={formState.errors.event_condition_value !== undefined}
            helperText={formState.errors.event_condition_value?.message}
            onBlur={() => {
              field.onBlur();
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {unit === 'c' ? '°C' : '°F'}
                </InputAdornment>
              ),
            }}
          />
        )}
      />
      {/*------REPEAT AFTER TIME------*/}
      <Controller
        name={`event_repeat_after`}
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
              e.target.value = val.toString();
              field.onBlur();
            }}
            error={formState.errors.event_repeat_after !== undefined}
            helperText={
              formState.errors.event_repeat_after?.message
                ? formState.errors.event_repeat_after?.message
                : 'Set to zero for non-repetition.'
            }
            onBlur={() => {
              field.onBlur();
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">s</InputAdornment>,
            }}
          />
        )}
      />
    </Stack>
  );
};
