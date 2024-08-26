import { useState, useEffect } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { TSettings, TCamera } from '../models/schema';
import { Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { StyledTextField } from '../components/FormInputs';
import { PasswordInput } from '../components/PasswordInput';
import { ViewAreaPicker } from '../components/ViewAreaPicker';
import { parseValueAsInt, getErrorObject, TWatches, validateCredentials } from '../utils';
import Stack from '@mui/material/Stack';
import { TCameraListOption } from '../hooks/useCameraList';

type Props = {
    index: number;
    areCredentialsValid: boolean;
    setAreCredentialsValid: (open: boolean) => void;
    viewAreaList: TCameraListOption[];
    onBlur?: () => void;
    onChange: () => void;
};
export const CameraConnectParams = ({
    onBlur,
    index,
    areCredentialsValid,
    setAreCredentialsValid,
    viewAreaList,
    onChange,
}: Props) => {
    const { control, setValue } = useFormContext<TSettings>();
    const [lastRequestAborter, setLastRequestAborter] = useState<AbortController | null>(null);
    const proxy: TWatches = {
        protocol: useWatch({ control, name: `cameras.${index}.protocol` }),
        ip: useWatch({ control, name: `cameras.${index}.ip` }),
        port: useWatch({ control, name: `cameras.${index}.port` }),
        user: useWatch({ control, name: `cameras.${index}.user` }),
        pass: useWatch({ control, name: `cameras.${index}.pass` }),
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

    const name = 'cameras.' + index;
    return (
        <Stack spacing={1.5}>
            <Controller
                name={`cameras.${index}.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        defaultValue={field.value}
                        onChange={(event) => {
                            const protocol = event.target.value;
                            setValue(`cameras.${index}.port`, protocol === 'http' ? 80 : 443, {
                                shouldTouch: true,
                            });

                            field.onChange(event);
                            onChange();
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
                name={`cameras.${index}.ip`}
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
                        onChange={(event) => {
                            field.onChange(event);
                            onChange();
                        }}
                    />
                )}
            />
            <Controller
                name={`cameras.${index}.port`}
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
                            onChange();
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
                name={`cameras.${index}.user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="User"
                        error={getErrorObject(formState.errors, name)?.user !== undefined}
                        helperText={getErrorObject(formState.errors, name)?.user?.message}
                        onChange={(event) => {
                            field.onChange(event);
                            onChange();
                        }}
                        onBlur={() => {
                            field.onBlur();
                            onBlur?.();
                        }}
                    />
                )}
            />
            <PasswordInput
                areCredentialsValid={areCredentialsValid}
                control={control}
                name={`cameras.${index}.pass`}
                onChange={onChange}
                onBlur={onBlur}
            />
            <Controller
                name={`cameras.${index}.cameraList`}
                control={control}
                render={({ field, formState }) => (
                    <ViewAreaPicker
                        {...field}
                        viewAreaList={viewAreaList}
                        onChange={(data) => field.onChange(data)}
                        error={formState.errors.cameras?.[index]?.cameraList !== undefined}
                        helperText={formState.errors.cameras?.[index]?.cameraList?.message}
                    />
                )}
            />
        </Stack>
    );
};

const PROTOCOL_LABELS: Record<TCamera['protocol'], string> = {
    http: 'HTTP',
    https: 'HTTPS',
    https_insecure: 'HTTPS (not trusted cert)',
};
const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as TCamera['protocol'][];
