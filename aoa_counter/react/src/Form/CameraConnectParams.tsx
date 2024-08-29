import { useState, useEffect } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { TSettings, TCamera } from '../models/schema';
import { Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { StyledTextField } from '../components/FormInputs';
import { PasswordInput } from '../components/PasswordInput';
import { parseValueAsInt, getErrorObject, TWatches, validateCredentials } from '../utils';
import { Title } from '../components/Title';
import Stack from '@mui/material/Stack';

type Props = {
    name: 'camera' | 'aoa';
    onBlur?: () => void;
};
export const CameraConnectParams = ({ onBlur, name }: Props) => {
    const { control, setValue } = useFormContext<TSettings>();
    const [areCredentialsValid, setAreCredentialsValid] = useState<boolean>(true);
    const [lastRequestAborter, setLastRequestAborter] = useState<AbortController | null>(null);
    const proxy: TWatches = {
        protocol: useWatch({ control, name: `${name}.protocol` }),
        ip: useWatch({ control, name: `${name}.ip` }),
        port: useWatch({ control, name: `${name}.port` }),
        user: useWatch({ control, name: `${name}.user` }),
        pass: useWatch({ control, name: `${name}.pass` }),
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
        <Stack spacing={1.5}>
            <Title text="Camera Connection settings" />
            <Controller
                name={`${name}.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        defaultValue={field.value}
                        onChange={(event) => {
                            const protocol = event.target.value;
                            setValue(`${name}.port`, protocol === 'http' ? 80 : 443, {
                                shouldTouch: true,
                            });

                            field.onChange(event);
                            onBlur?.();
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
                name={`${name}.ip`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="IP address"
                        error={getErrorObject(formState.errors, name)?.ip !== undefined}
                        helperText={getErrorObject(formState.errors, name)?.ip?.message}
                        onBlur={() => {
                            field.onBlur();
                            onBlur?.();
                        }}
                    />
                )}
            />
            <Controller
                name={`${name}.port`}
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
                            onBlur?.();
                        }}
                        fullWidth
                        label="Port"
                        error={getErrorObject(formState.errors, name)?.port !== undefined}
                        helperText={getErrorObject(formState.errors, name)?.port?.message}
                    />
                )}
            />
            <Controller
                name={`${name}.user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="User"
                        error={getErrorObject(formState.errors, name)?.user !== undefined}
                        helperText={getErrorObject(formState.errors, name)?.user?.message}
                        onBlur={() => {
                            field.onBlur();
                            onBlur?.();
                        }}
                    />
                )}
            />
            <PasswordInput areCredentialsValid={areCredentialsValid} control={control} name={name} onBlur={onBlur} />
        </Stack>
    );
};

const PROTOCOL_LABELS: Record<TCamera['protocol'], string> = {
    http: 'HTTP',
    https: 'HTTPS',
    https_insecure: 'HTTPS (not trusted cert)',
};
const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as TCamera['protocol'][];
