import { parseValueAsInt, parseValueAsFloat } from '../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledSelect } from '../components/FormInputs';
import { Stack, MenuItem, Grid, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { TSettings, TCamera } from '../models/schema';

const ConnectionParams = () => {
    const { control, setValue } = useFormContext<TSettings>();

    return (
        <Stack spacing={1.5}>
            <Controller
                name={`papago.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        defaultValue={field.value}
                        onChange={(event) => {
                            const protocol = event.target.value;
                            setValue(`papago.port`, protocol === 'http' ? 80 : 443, {
                                shouldTouch: true,
                            });

                            field.onChange(event);
                        }}
                    >
                        {PROTOCOLS.map((value) => (
                            <FormControlLabel
                                key={value}
                                value={value}
                                control={<Radio />}
                                label={PROTOCOL_LABELS[value]}
                            />
                        ))}
                    </RadioGroup>
                )}
            />
            <Controller
                name={`papago.ip`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="IP address"
                        error={formState.errors.papago?.ip !== undefined}
                        helperText={formState.errors.papago?.ip?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
            <Controller
                name={`papago.port`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        defaultValue={field.value}
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => {
                            const val = parseValueAsInt(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                            field.onBlur();
                        }}
                        fullWidth
                        label="Port"
                        error={formState.errors.papago?.port !== undefined}
                        helperText={formState.errors.papago?.port?.message}
                    />
                )}
            />
        </Stack>
    );
};
const Papago = () => {
    const { control } = useFormContext<TSettings>();

    return (
        <Stack spacing={1.5}>
            <Controller
                name={'papago.updateFrequency'}
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
                        error={formState.errors.papago?.updateFrequency !== undefined}
                        helperText={formState.errors.papago?.updateFrequency?.message}
                    />
                )}
            />
            <Controller
                name={`papago.portID`}
                control={control}
                render={({ field }) => (
                    <StyledSelect {...field} label="Papago port ID">
                        {PORT.map((value) => (
                            <MenuItem key={value} value={value}>
                                {PORT_LABELS[value]}
                            </MenuItem>
                        ))}
                    </StyledSelect>
                )}
            />
        </Stack>
    );
};

export const PapagoSettings = () => {
    return (
        <Grid container>
            <Grid item md={6} xs={12}>
                <ConnectionParams />
            </Grid>
            <Grid item md={6} xs={12}>
                <Papago />
            </Grid>
        </Grid>
    );
};

const PORT_LABELS: Record<string, string> = {
    1: 'A',
    2: 'B',
};
const PORT = Object.keys(PORT_LABELS);

const PROTOCOL_LABELS: Record<TCamera['protocol'], string> = {
    http: 'HTTP',
    https: 'HTTPS',
    https_insecure: 'HTTPS (not trusted cert)',
};
const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as TCamera['protocol'][];
