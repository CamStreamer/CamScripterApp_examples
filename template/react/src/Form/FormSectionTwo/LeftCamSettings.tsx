import { Controller, useFormContext } from 'react-hook-form';
import { TSettings, TCamera } from '../../models/schema';
import { useCredentialsValidate } from '../../hooks/useCredentialsValidate';
import { Radio, RadioGroup, Stack } from '@mui/material';
import { StyledTextField, StyledRadioControlLabel } from '../../components/FormInputs';
import { PasswordInput } from '../../components/PasswordInput';
import { parseValueAsInt, getErrorObject } from '../../utils';
import { Title } from '../../components/Title';

type Props = {
    name: 'camera';
    onBlur?: () => void;
};

export const LeftCamSettings = ({ onBlur, name }: Props) => {
    const { control, setValue } = useFormContext<TSettings>();
    const [areCredentialsValid] = useCredentialsValidate({ name });

    return (
        <Stack spacing={1.5}>
            <Title text="Camera Connection Settings" />
            <Controller
                name={`${name}.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        value={field.value}
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
                        value={field.value}
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
                        error={formState.errors[name]?.user !== undefined}
                        helperText={formState.errors[name]?.user?.message}
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
