import { parseValueAsInt, getErrorObject } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledRadioControlLabel } from '../../components/FormInputs';
import { Stack, Radio, RadioGroup } from '@mui/material';
import { TSettings, TCamera } from '../../models/schema';

type Props = {
    name: 'application';
    onBlur?: () => void;
};

export const LeftAppSettings = ({ onBlur, name }: Props) => {
    const { control, setValue } = useFormContext<TSettings>();

    return (
        <Stack spacing={1.5}>
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
        </Stack>
    );
};

const PROTOCOL_LABELS: Record<TCamera['protocol'], string> = {
    http: 'HTTP',
    https: 'HTTPS',
    https_insecure: 'HTTPS (not trusted cert)',
};
const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as TCamera['protocol'][];
