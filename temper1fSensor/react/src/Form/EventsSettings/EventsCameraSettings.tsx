import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledSelect } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import {
  Stack,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Button,
} from '@mui/material';
import { PasswordInput } from '../../components/PasswordInput';
import { TAppSchema } from '../../models/schema';
import {
  VIEW_AREAS,
  VIEW_AREAS_LABELS,
  PROTOCOLS,
  PROTOCOL_LABELS,
} from '../constants';

export const EventsCameraSettings = () => {
  const { control, setValue } = useFormContext<TAppSchema>();

  return (
    <Stack spacing={1.5}>
      <Title text="Camera Settings" />
      {/*------PROTOCOL------*/}
      <Controller
        name={`event_camera_protocol`}
        control={control}
        render={({ field }) => (
          <RadioGroup
            row
            defaultValue={field.value}
            onChange={(event) => {
              const protocol = event.target.value;
              setValue(`event_camera_port`, protocol === 'http' ? 80 : 443, {
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
        name={`event_camera_ip`}
        control={control}
        render={({ field, formState }) => (
          <StyledTextField
            {...field}
            type="text"
            fullWidth
            placeholder={field.value || 'IP Address'}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button variant="text">FIND CAMERA</Button>
                </InputAdornment>
              ),
            }}
            error={formState.errors?.event_camera_ip !== undefined}
            helperText={formState.errors?.event_camera_ip?.message}
            onBlur={() => {
              field.onBlur();
            }}
            onChange={(event) => {
              field.onChange(event);
            }}
          />
        )}
      />
      {/*------PORT------*/}
      <Controller
        name={`event_camera_port`}
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
            error={formState.errors.event_camera_port !== undefined}
            helperText={formState.errors.event_camera_port?.message}
          />
        )}
      />
      {/*------USER------*/}
      <Controller
        name={`event_camera_user`}
        control={control}
        render={({ field, formState }) => (
          <StyledTextField
            {...field}
            InputLabelProps={{ shrink: true }}
            fullWidth
            label="User"
            error={formState.errors.event_camera_user !== undefined}
            helperText={formState.errors.event_camera_user?.message}
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
      {/*------VIEW AREA(S)------*/}
      <Controller
        name={`event_view_areas`}
        control={control}
        render={({ field }) => (
          <StyledSelect {...field} label="View area(s)">
            {VIEW_AREAS.map((value) => (
              <MenuItem key={value} value={value}>
                {VIEW_AREAS_LABELS[value]}
              </MenuItem>
            ))}
          </StyledSelect>
        )}
      />
    </Stack>
  );
};
