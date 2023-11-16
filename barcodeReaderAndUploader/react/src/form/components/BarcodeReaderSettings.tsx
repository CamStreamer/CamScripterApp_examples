import { Controller, useFormContext } from 'react-hook-form';
import { InputAdornment, TextField } from '@mui/material';

import React from 'react';
import { StyledFormValuesRow } from '../HelperComponents';
import { TFormValues } from '../models/schema';
import { WithLabel } from './WithLabel';

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
