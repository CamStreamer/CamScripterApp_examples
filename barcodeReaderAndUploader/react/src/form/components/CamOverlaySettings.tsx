import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { parseScaledDisplayValue, parseScaledValue, parseValueAsInt } from '../utils';

import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import React from 'react';
import Select from '@mui/material/Select';
import { StyledFormValuesRow } from '../HelperComponents';
import { TFormValues } from '../models/schema';
import TextField from '@mui/material/TextField';
import { WithLabel } from './WithLabel';

export const positionOptionLabels: Record<TFormValues['alignment'], string> = {
    top_left: 'Top Left',
    top: 'Top Center',
    top_right: 'Top Right',
    left: 'Center Left',
    center: 'Center',
    right: 'Center Right',
    bottom_left: 'Bottom Left',
    bottom: 'Bottom Center',
    bottom_right: 'Bottom Right',
};

export const CamOverlaySettings = () => {
    const { control } = useFormContext<TFormValues>();

    return (
        <StyledFormValuesRow>
            <WithLabel label="Position" htmlFor="COALignment">
                <Controller
                    name="alignment"
                    control={control}
                    render={({ field }) => (
                        <Select id="COALignment" aria-labelledby="COALignment" {...field} fullWidth>
                            {(Object.keys(positionOptionLabels) as TFormValues['alignment'][]).map((value) => (
                                <MenuItem key={value} value={value}>
                                    {positionOptionLabels[value]}
                                </MenuItem>
                            ))}
                        </Select>
                    )}
                />
            </WithLabel>
            <WithLabel label="Offset X" htmlFor="cameraX">
                <Controller
                    name="x"
                    control={control}
                    render={({ field, formState }) => (
                        <TextField
                            id="cameraX"
                            aria-labelledby="cameraX"
                            type="number"
                            {...field}
                            onChange={(e) => {
                                field.onChange(parseValueAsInt(e.target.value));
                            }}
                            fullWidth
                            error={!!formState.errors.x}
                            helperText={formState.errors.x?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        px
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
            </WithLabel>
            <WithLabel label="Offset Y" htmlFor="cameraY">
                <Controller
                    name="y"
                    control={control}
                    render={({ field, formState }) => (
                        <TextField
                            id="cameraY"
                            aria-labelledby="cameraY"
                            type="number"
                            {...field}
                            onChange={(e) => {
                                field.onChange(parseValueAsInt(e.target.value));
                            }}
                            fullWidth
                            error={!!formState.errors.y}
                            helperText={formState.errors.y?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        px
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
            </WithLabel>
            <WithLabel label="Scale" htmlFor="cameraScale">
                <Controller
                    name="scale"
                    control={control}
                    render={({ field, formState }) => (
                        <TextField
                            id="cameraScale"
                            aria-labelledby="cameraScale"
                            value={parseScaledDisplayValue(field.value, 100)}
                            fullWidth
                            type="number"
                            onChange={(e) => {
                                field.onChange(parseScaledValue(e.target.value, 2));
                            }}
                            error={!!formState.errors.scale}
                            helperText={formState.errors.scale?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        %
                                    </InputAdornment>
                                ),
                            }}
                            inputProps={{
                                step: 5,
                            }}
                        />
                    )}
                />
            </WithLabel>
            <WithLabel label="Stream width" htmlFor="cameraStreamWidth">
                <Controller
                    name="width"
                    control={control}
                    render={({ field, formState }) => (
                        <TextField
                            id="cameraStreamWidth"
                            aria-labelledby="cameraStreamWidth"
                            type="number"
                            {...field}
                            onChange={(e) => {
                                field.onChange(parseValueAsInt(e.target.value));
                            }}
                            fullWidth
                            error={!!formState.errors.width}
                            helperText={formState.errors.width?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        px
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
            </WithLabel>
            <WithLabel label="Stream height" htmlFor="cameraStreamHeight">
                <Controller
                    name="height"
                    control={control}
                    render={({ field, formState }) => (
                        <TextField
                            id="cameraStreamHeight"
                            aria-labelledby="cameraStreamHeight"
                            type="number"
                            {...field}
                            onChange={(e) => {
                                field.onChange(parseValueAsInt(e.target.value));
                            }}
                            fullWidth
                            error={!!formState.errors.height}
                            helperText={formState.errors.height?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        px
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
            </WithLabel>
        </StyledFormValuesRow>
    );
};
