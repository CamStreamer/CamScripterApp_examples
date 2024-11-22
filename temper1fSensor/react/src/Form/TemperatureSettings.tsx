import { Controller, useFormContext } from 'react-hook-form';
import styled from '@mui/material/styles/styled';
import { StyledRadioControlLabel } from '../components/FormInputs';
import { Stack, Grid, Radio, RadioGroup } from '@mui/material';
import { TAppSchema } from '../models/schema';

type Temp = 'c' | 'f';

export const TemperatureSettings = () => {
    const { control } = useFormContext<TAppSchema>();

    return (
        <StyledGrid container>
            <Stack>
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
                                <StyledRadioControlLabel
                                    key={value}
                                    value={value}
                                    control={<Radio color="info" />}
                                    label={TEMEPRATURES_LABELS[value]}
                                />
                            ))}
                        </RadioGroup>
                    )}
                />
            </Stack>
        </StyledGrid>
    );
};

const StyledGrid = styled(Grid)`
    margin-bottom: 15px;
`;

const TEMEPRATURES_LABELS: Record<TAppSchema['unit'], string> = {
    c: 'Celsius',
    f: 'Fahrenheit',
};
const TEMPERATURES = Object.keys(TEMEPRATURES_LABELS) as TAppSchema['unit'][];
