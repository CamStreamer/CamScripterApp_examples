import styled from '@emotion/styled';
import { Controller, useFormContext } from 'react-hook-form';
import { TSettings } from '../models/schema';
import { StyledSelect, StyledTextField, StyledSwitch } from '../components/FormInputs';
import { COORD_LIST, coordOptionLabels, parseValueAsFloat, parseValueAsInt } from '../utils';
import { Grid, FormControlLabel, InputAdornment, MenuItem, Stack } from '@mui/material';

export const WidgetSettings = () => {
    const { control } = useFormContext<TSettings>();
    return (
        <Grid container>
            <Grid item xs={12}>
                <Controller
                    name="widget.enabled"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <StyledSwitch
                                    checked={field.value}
                                    onChange={(e, v) => {
                                        field.onChange(v);
                                    }}
                                />
                            }
                            label={'Active'}
                        />
                    )}
                />
            </Grid>
            <StyledGrid item xs={12} md={6} direction="column">
                <Stack spacing={1.5}>
                    <Controller
                        name={'widget.coAlignment'}
                        control={control}
                        render={({ field }) => (
                            <StyledSelect {...field} label="Position">
                                {COORD_LIST.map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {coordOptionLabels[value]}
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        )}
                    />
                    <Controller
                        name={'widget.x'}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                defaultValue={field.value}
                                InputLabelProps={{ shrink: true }}
                                onBlur={(e) => {
                                    const val = parseValueAsInt(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                fullWidth
                                label="Offset X"
                                error={!!formState.errors.widget?.x}
                                helperText={formState.errors.widget?.x?.message}
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
                    <Controller
                        name={'widget.y'}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                defaultValue={field.value}
                                InputLabelProps={{ shrink: true }}
                                onBlur={(e) => {
                                    const val = parseValueAsInt(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                fullWidth
                                label="Offset Y"
                                error={!!formState.errors.widget?.y}
                                helperText={formState.errors.widget?.y?.message}
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
                </Stack>
            </StyledGrid>
            <StyledGrid item xs={12} md={6} direction="column">
                <Stack spacing={1.5}>
                    <Controller
                        name={'widget.screenWidth'}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                defaultValue={field.value}
                                InputLabelProps={{ shrink: true }}
                                onBlur={(e) => {
                                    const val = parseValueAsInt(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                fullWidth
                                label="Stream Width"
                                error={!!formState.errors.widget?.screenWidth}
                                helperText={formState.errors.widget?.screenWidth?.message}
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
                    <Controller
                        name={'widget.screenHeight'}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                defaultValue={field.value}
                                InputLabelProps={{ shrink: true }}
                                onBlur={(e) => {
                                    const val = parseValueAsInt(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                fullWidth
                                label="Stream Height"
                                error={!!formState.errors.widget?.screenHeight}
                                helperText={formState.errors.widget?.screenHeight?.message}
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
                    <Controller
                        name={'widget.scale'}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                defaultValue={field.value}
                                fullWidth
                                label="Scale"
                                InputLabelProps={{ shrink: true }}
                                onBlur={(e) => {
                                    const val = parseValueAsFloat(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                error={!!formState.errors.widget?.scale}
                                helperText={formState.errors.widget?.scale?.message}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end" disableTypography>
                                            %
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}
                    />
                </Stack>
            </StyledGrid>
        </Grid>
    );
};

const StyledGrid = styled(Grid)({ padding: 5 });
