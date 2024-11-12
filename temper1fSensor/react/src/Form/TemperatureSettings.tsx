import { Controller, useFormContext } from 'react-hook-form';
import {
  Stack,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { TAppSchema } from '../models/schema';

export const TemperatureSettings = () => {
  const { control, setValue } = useFormContext<TAppSchema>();

  return (
    <Grid container>
      <Stack spacing={1.5} margin={'0 0 16px 16px'}>
        <Controller
          name={`unit`}
          control={control}
          render={({ field }) => (
            <RadioGroup
              row
              defaultValue={field.value}
              onChange={(event) => {
                const temperature = event.target.value;
                setValue(`unit`, temperature === 'c' ? 'c' : 'f', {
                  shouldTouch: true,
                });

                field.onChange(event);
              }}
            >
              {TEMPERATURES.map((value) => (
                <FormControlLabel
                  key={value}
                  value={value}
                  control={<Radio />}
                  label={TEMEPRATURES_LABELS[value]}
                />
              ))}
            </RadioGroup>
          )}
        />
      </Stack>
    </Grid>
  );
};

const TEMEPRATURES_LABELS: Record<TAppSchema['unit'], string> = {
  c: 'Celsius',
  f: 'Fahrenheit',
};
const TEMPERATURES = Object.keys(TEMEPRATURES_LABELS) as TAppSchema['unit'][];
