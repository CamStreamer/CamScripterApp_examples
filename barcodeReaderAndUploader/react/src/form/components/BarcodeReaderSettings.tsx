import { Controller, useFormContext } from 'react-hook-form';

import InputAdornment from '@mui/material/InputAdornment';
import React from 'react';
import { StyledFormValuesRow } from '../HelperComponents';
import { TFormValues } from '../models/schema';
import TextField from '@mui/material/TextField';
import { WithLabel } from './WithLabel';
import { parseValueAsInt } from '../utils';

export const BarcodeReaderSettings = () => {
    const { control } = useFormContext<TFormValues>();
    return (
        <StyledFormValuesRow>
            <WithLabel label="Display time" htmlFor="bcDisplayTime">
                <Controller
                    name="displayTimeS"
                    control={control}
                    render={({ field, formState }) => (
                        <TextField
                            id="bcDisplayTime"
                            aria-labelledby="bcDisplayTime"
                            type="number"
                            {...field}
                            onChange={(e) => {
                                field.onChange(parseValueAsInt(e.target.value));
                            }}
                            fullWidth
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        s
                                    </InputAdornment>
                                ),
                            }}
                            error={!!formState.errors.displayTimeS}
                            helperText={formState.errors.displayTimeS?.message}
                        />
                    )}
                />
            </WithLabel>
        </StyledFormValuesRow>
    );
};
