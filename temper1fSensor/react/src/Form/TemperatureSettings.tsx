import { Controller, useFormContext } from 'react-hook-form';
import {
  Stack,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { TAppSchema } from '../models/schema';

type Temp = 'c' | 'f';

export const TemperatureSettings = () => {
  const { control } = useFormContext<TAppSchema>();

  return (
    <Grid container>
      <Stack spacing={1.5} margin={'0 0 16px 16px'}>
        <Controller
          name={`unit`}
          control={control}
          render={({ field }) => (
            <RadioGroup
              row
              value={field.value}
              onChange={(event) => {
                field.onChange(event.target.value as Temp);
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
