import { appInfo } from '../appInfo';
import { parseValueAsInt, parseValueAsFloat } from '../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledSelect, StyledRadioControlLabel } from '../components/FormInputs';
import { Stack, MenuItem, Grid, Radio, RadioGroup } from '@mui/material';
import { TSettings, TCamera } from '../models/schema';

const ConnectionParams = () => {
    const { control, setValue } = useFormContext<TSettings>();

    return (
        <Stack spacing={1.5}>
            <Controller
                name={`application.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        defaultValue={field.value}
                        onChange={(event) => {
                            const protocol = event.target.value;
                            setValue(`application.port`, protocol === 'http' ? 80 : 443, {
                                shouldTouch: true,
                            });

                            field.onChange(event);
                        }}
                    >
                        {PROTOCOLS.map((value) => (
                            <StyledRadioControlLabel
                                key={value}
                                value={value}
                                control={<Radio color="info" />}
                                label={PROTOCOL_LABELS[value]}
                            />
                        ))}
                    </RadioGroup>
                )}
            />
            <Controller
                name={`application.ip`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="IP address"
                        error={formState.errors.application?.ip !== undefined}
                        helperText={formState.errors.application?.ip?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
            <Controller
                name={`application.port`}
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
                        error={formState.errors.application?.port !== undefined}
                        helperText={formState.errors.application?.port?.message}
                    />
                )}
            />
        </Stack>
    );
};
const Application = () => {
    const { control } = useFormContext<TSettings>();

    return (
        <Stack spacing={1.5}>
            <Controller
                name={'application.updateFrequency'}
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
                        error={formState.errors.application?.updateFrequency !== undefined}
                        helperText={formState.errors.application?.updateFrequency?.message}
                    />
                )}
            />
            <Controller
                name={`application.portID`}
                control={control}
                render={({ field }) => (
                    <StyledSelect {...field} label={`${appInfo.name} port ID`}>
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

export const ApplicationSettings = () => {
    return (
        <Grid container>
            <Grid item md={6} xs={12}>
                <ConnectionParams />
            </Grid>
            <Grid item md={6} xs={12}>
                <Application />
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
