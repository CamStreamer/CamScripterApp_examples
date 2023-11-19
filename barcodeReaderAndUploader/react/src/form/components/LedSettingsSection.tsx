import { Controller, useFormContext } from 'react-hook-form';

import React from 'react';
import { StyledFormValuesRow } from '../HelperComponents';
import { TFormValues } from '../models/schema';
import TextField from '@mui/material/TextField';
import { WithLabel } from './WithLabel';
import { parseValueAsInt } from '../utils';

export const LedSettingsSection = () => {
    const { control } = useFormContext<TFormValues>();
    return (
        <StyledFormValuesRow>
            <WithLabel label="Green LED port" htmlFor="greenLed">
                <Controller
                    name="greenPort"
                    control={control}
                    render={({ field, formState }) => (
                        <TextField
                            id="greenLed"
                            aria-labelledby="greenLed"
                            {...field}
                            onChange={(e) => {
                                field.onChange(parseValueAsInt(e.target.value));
                            }}
                            fullWidth
                            error={!!formState.errors.greenPort}
                            helperText={formState.errors.greenPort?.message}
                        />
                    )}
                />
            </WithLabel>
            <WithLabel label="Red LED port" htmlFor="redPort">
                <Controller
                    name="redPort"
                    control={control}
                    render={({ field, formState }) => (
                        <TextField
                            id="redPort"
                            aria-labelledby="redPort"
                            {...field}
                            onChange={(e) => {
                                field.onChange(parseValueAsInt(e.target.value));
                            }}
                            fullWidth
                            error={!!formState.errors.redPort}
                            helperText={formState.errors.redPort?.message}
                        />
                    )}
                />
            </WithLabel>
        </StyledFormValuesRow>
    );
};
