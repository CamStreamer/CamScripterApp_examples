import { parseValueAsFloat } from '../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledSelect, StyledSwitch } from '../components/FormInputs';
import { InputAdornment, FormControlLabel, MenuItem, Grid, FormControl, FormHelperText } from '@mui/material';
import { TSettings, TEvent } from '../models/schema';
import { Title } from '../components/Title';
import styled from '@mui/material/styles/styled';

type EventProps = {
    type: 'low' | 'high';
};
const EventForm = ({ type }: EventProps) => {
    const { control } = useFormContext<TSettings>();
    const name = `${type}Event` as `${'low' | 'high'}Event`;
    return (
        <Grid container spacing={1.5} direction="column">
            <Grid item>
                <Controller
                    name={`${name}.enabled`}
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
            <Grid item>
                <Controller
                    name={`${name}.triggerDelay`}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            fullWidth
                            label="Triggered after"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        s
                                    </InputAdornment>
                                ),
                            }}
                            InputLabelProps={{ shrink: true }}
                            onBlur={(e) => {
                                const val = parseValueAsFloat(e.target.value);
                                field.onChange(val);
                                e.target.value = val.toString();
                            }}
                            error={formState.errors[name]?.triggerDelay !== undefined}
                            helperText={formState.errors[name]?.triggerDelay?.message}
                        />
                    )}
                />
            </Grid>
            <Grid item>
                <Controller
                    name={`${name}.condition`}
                    control={control}
                    render={({ field }) => (
                        <StyledSelect {...field} label="When">
                            {CONDITIONS.map((value) => (
                                <MenuItem key={value} value={value}>
                                    {CONDITION_LABELS[value]}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    )}
                />
            </Grid>
            <Grid item>
                <Controller
                    name={`${name}.value`}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            fullWidth
                            label="Value"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        lx
                                    </InputAdornment>
                                ),
                            }}
                            InputLabelProps={{ shrink: true }}
                            onBlur={(e) => {
                                const val = parseValueAsFloat(e.target.value);
                                field.onChange(val);
                                e.target.value = val.toString();
                            }}
                            error={formState.errors[name]?.triggerDelay !== undefined}
                            helperText={formState.errors[name]?.triggerDelay?.message}
                        />
                    )}
                />
            </Grid>
            <Grid item>
                <Controller
                    name={`${name}.repeatDelay`}
                    control={control}
                    render={({ field, formState }) => (
                        <FormControl fullWidth>
                            <StyledTextField
                                defaultValue={field.value}
                                label="Repeat after"
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end" disableTypography>
                                            s
                                        </InputAdornment>
                                    ),
                                }}
                                onBlur={(e) => {
                                    const val = parseValueAsFloat(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                error={formState.errors[name]?.repeatDelay !== undefined}
                                helperText={formState.errors[name]?.repeatDelay?.message}
                            />
                            <FormHelperText>Set zero for non-repetition.</FormHelperText>
                        </FormControl>
                    )}
                />
            </Grid>
        </Grid>
    );
};

export const EventSettings = () => {
    return (
        <Grid container spacing={2}>
            <StyledGrid item xs={12} md={6}>
                <Title text="Low intensity event" />
                <EventForm type="low" />
            </StyledGrid>
            <StyledGrid item xs={12} md={6}>
                <Title text="High intensity event" />
                <EventForm type="high" />
            </StyledGrid>
        </Grid>
    );
};

const StyledGrid = styled(Grid)({ margin: 0 });

const CONDITION_LABELS: Record<TEvent['condition'], string> = {
    '<': 'Lower than',
    '<=': 'Lower than or equal to',
    '=': 'Equal to',
    '>': 'Higher than',
    '>=': 'Higher than or equal to',
};
const CONDITIONS = Object.keys(CONDITION_LABELS) as TEvent['condition'][];
