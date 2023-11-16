import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { InputAdornment, MenuItem, Select, TextField } from '@mui/material';

import React from 'react';
import { StyledFormValuesRow } from '../HelperComponents';
import { TFormValues } from '../models/schema';
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
    const { control, formState, setValue } = useFormContext<TFormValues>();

    const scale = useWatch<TFormValues, 'scale'>({
        name: 'scale',
    });
    const scaleValue = Math.floor(scale * 100);

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
                            {...field}
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
                            {...field}
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
                <TextField
                    id="cameraScale"
                    aria-labelledby="cameraScale"
                    value={scaleValue}
                    fullWidth
                    type="number"
                    onChange={(e) => {
                        console.log(e.target.value);
                        const parsedVal = parseInt(e.target.value);
                        const newVal = isNaN(parsedVal) ? 0 : parsedVal;
                        setValue('scale', parseFloat((newVal / 100).toFixed(2)), {
                            shouldValidate: true,
                        });
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
            </WithLabel>
            <WithLabel label="Stream width" htmlFor="cameraStreamWidth">
                <Controller
                    name="width"
                    control={control}
                    render={({ field, formState }) => (
                        <TextField
                            id="cameraStreamWidth"
                            aria-labelledby="cameraStreamWidth"
                            {...field}
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
                            {...field}
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
