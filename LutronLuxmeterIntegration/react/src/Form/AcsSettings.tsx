import { useState, useEffect } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { TSettings, TAcs } from '../models/schema';
import { Radio, RadioGroup, FormControlLabel, FormControl, FormHelperText } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { StyledTextField } from '../components/FormInputs';
import { PasswordInput } from '../components/PasswordInput';
import { parseValueAsInt, getErrorObject, TWatches, validateCredentials } from '../utils';
import { EventForm } from './EventSettings';
import Grid from '@mui/material/Grid';

type Props = {
    areCredentialsValid: boolean;
    setAreCredentialsValid: (open: boolean) => void;
    onBlur?: () => void;
};

const AcsConnectParams = ({ onBlur, areCredentialsValid, setAreCredentialsValid }: Props) => {
    const { control } = useFormContext<TSettings>();
    const [lastRequestAborter, setLastRequestAborter] = useState<AbortController | null>(null);
    const proxy: TWatches = {
        protocol: useWatch({ control, name: `acs.protocol` }),
        ip: useWatch({ control, name: `acs.ip` }),
        port: useWatch({ control, name: `acs.port` }),
        user: useWatch({ control, name: `acs.user` }),
        pass: useWatch({ control, name: `acs.pass` }),
    };

    useEffect(() => {
        lastRequestAborter?.abort();
        const [aborter, areValidPromise] = validateCredentials(proxy);
        setLastRequestAborter(aborter);

        areValidPromise
            .then((areValid) => {
                setAreCredentialsValid(areValid);
                setLastRequestAborter(null);
            })
            .catch(console.error);
    }, [proxy.protocol, proxy.ip, proxy.port, proxy.user, proxy.pass]);

    return (
        <Grid container spacing={1.5}>
            <Grid item>
                <Controller
                    name={`acs.protocol`}
                    control={control}
                    render={({ field }) => (
                        <StyledRadioGroup row defaultValue={field.value}>
                            {PROTOCOLS.map((value) => (
                                <FormControlLabel
                                    key={value}
                                    value={value}
                                    control={<Radio />}
                                    label={PROTOCOL_LABELS[value]}
                                />
                            ))}
                        </StyledRadioGroup>
                    )}
                />
            </Grid>
            <Grid item xs={12}>
                <Controller
                    name={`acs.ip`}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            {...field}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            label="IP address"
                            error={getErrorObject(formState.errors, 'acs')?.ip !== undefined}
                            helperText={getErrorObject(formState.errors, 'acs')?.ip?.message}
                            onBlur={() => {
                                field.onBlur();
                                onBlur?.();
                            }}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12}>
                <Controller
                    name={`acs.port`}
                    control={control}
                    render={({ field, formState }) => (
                        <FormControl fullWidth>
                            <StyledTextField
                                {...field}
                                defaultValue={field.value}
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => {
                                    const val = parseValueAsInt(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                    field.onBlur();
                                    onBlur?.();
                                }}
                                fullWidth
                                label="Port"
                                error={getErrorObject(formState.errors, 'acs')?.port !== undefined}
                                helperText={getErrorObject(formState.errors, 'acs')?.port?.message}
                            />
                            <FormHelperText>Default ports are 29204 or 55756.</FormHelperText>
                        </FormControl>
                    )}
                />
            </Grid>
            <Grid item xs={12}>
                <Controller
                    name={`acs.source_key`}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            {...field}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            label="Source Key"
                            error={formState.errors.acs?.source_key !== undefined}
                            helperText={formState.errors.acs?.source_key?.message}
                            onBlur={() => {
                                field.onBlur();
                                onBlur?.();
                            }}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12}>
                <Controller
                    name={`acs.user`}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            {...field}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            label="User"
                            error={getErrorObject(formState.errors, 'acs')?.user !== undefined}
                            helperText={getErrorObject(formState.errors, 'acs')?.user?.message}
                            onBlur={() => {
                                field.onBlur();
                                onBlur?.();
                            }}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12}>
                <PasswordInput
                    areCredentialsValid={areCredentialsValid}
                    control={control}
                    name={`acs.pass`}
                    onBlur={onBlur}
                />
            </Grid>
        </Grid>
    );
};

export const AcsSettings = ({ onBlur, areCredentialsValid, setAreCredentialsValid }: Props) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <AcsConnectParams
                    onBlur={onBlur}
                    areCredentialsValid={areCredentialsValid}
                    setAreCredentialsValid={setAreCredentialsValid}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <EventForm name="acs" />
            </Grid>
        </Grid>
    );
};

const StyledRadioGroup = styled(RadioGroup)({ paddingLeft: 7, minHeight: 56 });

const PROTOCOL_LABELS: Record<TAcs['protocol'], string> = {
    http: 'HTTP',
    https: 'HTTPS',
    https_insecure: 'HTTPS (not trusted cert)',
};
const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as TAcs['protocol'][];
