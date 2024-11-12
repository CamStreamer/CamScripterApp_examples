import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { Stack, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { PasswordInput } from '../../components/PasswordInput';
import { TAppSchema } from '../../models/schema';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants';

export const CameraStationSettings = () => {
  const { control, setValue } = useFormContext<TAppSchema>();

  return (
    <Stack spacing={1.5}>
      <Title text="Camera Station Settings" />
      {/*------PROTOCOL------*/}
      <Controller
        name={`acs_protocol`}
        control={control}
        render={({ field }) => (
          <RadioGroup
            row
            defaultValue={field.value}
            onChange={(event) => {
              const protocol = event.target.value;
              setValue(`acs_port`, protocol === 'http' ? 80 : 443, {
                shouldTouch: true,
              });

              field.onChange(event);
            }}
          >
            {PROTOCOLS.map((value) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio />}
                label={PROTOCOL_LABELS[value]}
              />
            ))}
          </RadioGroup>
        )}
      />
      {/*------IP ADDRESS------*/}
      <Controller
        name={`acs_ip`}
        control={control}
        render={({ field, formState }) => (
          <StyledTextField
            {...field}
            InputLabelProps={{ shrink: true }}
            fullWidth
            label="IP address"
            error={formState.errors.acs_ip !== undefined}
            helperText={formState.errors.acs_ip?.message}
            onBlur={() => {
              field.onBlur();
            }}
          />
        )}
      />
      {/*------PORT------*/}
      <Controller
        name={`acs_port`}
        control={control}
        render={({ field, formState }) => (
          <StyledTextField
            {...field}
            InputLabelProps={{ shrink: true }}
            fullWidth
            label="Port"
            onChange={(e) => {
              const val = parseValueAsInt(e.target.value);
              field.onChange(val);
              e.target.value = val.toString();
              field.onBlur();
            }}
            error={formState.errors.acs_port !== undefined}
            helperText={formState.errors.acs_port?.message}
          />
        )}
      />
      {/*------USER------*/}
      <Controller
        name={`acs_user`}
        control={control}
        render={({ field, formState }) => (
          <StyledTextField
            {...field}
            InputLabelProps={{ shrink: true }}
            fullWidth
            label="User"
            error={formState.errors.acs_user !== undefined}
            helperText={formState.errors.acs_user?.message}
            onBlur={() => {
              field.onBlur();
            }}
          />
        )}
      />
      {/*------PASSWORD------*/}
      <PasswordInput
        areCredentialsValid={true}
        control={control}
        placeholder="Password"
      />
      {/*------SOURCE KEY------*/}
      <Controller
        name={`acs_source_key`}
        control={control}
        render={({ field, formState }) => (
          <StyledTextField
            {...field}
            InputLabelProps={{ shrink: true }}
            fullWidth
            placeholder="Source key"
            error={formState.errors.acs_source_key !== undefined}
            helperText={formState.errors.acs_source_key?.message}
            onBlur={() => {
              field.onBlur();
            }}
          />
        )}
      />
    </Stack>
  );
};
