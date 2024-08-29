import { parseValueAsFloat } from '../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { Title } from '../components/Title';
import { StyledTextField, StyledSelect } from '../components/FormInputs';
import { Stack, MenuItem, Grid } from '@mui/material';
import { TSettings } from '../models/schema';
import { CameraConnectParams } from './CameraConnectParams';

const Aoa = () => {
    const { control } = useFormContext<TSettings>();

    return (
        <Stack spacing={1.5}>
            <Title text="AXIS Object Analytics settings" />
            <Controller
                name={'aoa.updateFrequency'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        defaultValue={field.value}
                        fullWidth
                        label="Update Frequency"
                        InputLabelProps={{ shrink: true }}
                        onBlur={(e) => {
                            const val = parseValueAsFloat(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                        }}
                        error={formState.errors.aoa?.updateFrequency !== undefined}
                        helperText={formState.errors.aoa?.updateFrequency?.message}
                    />
                )}
            />

            <Controller
                name={`aoa.scenarioId`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        defaultValue={field.value}
                        fullWidth
                        label="Scenatio ID"
                        InputLabelProps={{ shrink: true }}
                        onBlur={(e) => {
                            const val = parseValueAsFloat(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                        }}
                        error={formState.errors.aoa?.scenarioId !== undefined}
                        helperText={formState.errors.aoa?.scenarioId?.message}
                    />
                )}
            />
            <Controller
                name={`aoa.method`}
                control={control}
                render={({ field }) => (
                    <StyledSelect {...field} label="When">
                        {METHOD.map((value) => (
                            <MenuItem key={value} value={value}>
                                {METHOD_LABELS[value]}
                            </MenuItem>
                        ))}
                    </StyledSelect>
                )}
            />
        </Stack>
    );
};

export const AoaSettings = () => {
    return (
        <Grid container>
            <Grid item md={6} xs={12}>
                <CameraConnectParams name="aoa" />
            </Grid>
            <Grid item md={6} xs={12}>
                <Aoa />
            </Grid>
        </Grid>
    );
};

type TMethods = 'getOccupancy' | 'getAccumulatedCounts';
const METHOD_LABELS: Record<TMethods, string> = {
    getOccupancy: 'getOccupancy',
    getAccumulatedCounts: 'getAccumulatedCounts',
};
const METHOD = Object.keys(METHOD_LABELS) as TMethods[];
