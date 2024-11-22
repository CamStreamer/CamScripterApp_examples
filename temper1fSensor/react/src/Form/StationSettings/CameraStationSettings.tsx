import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledRadioControlLabel } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { Stack, Radio, RadioGroup } from '@mui/material';
import { PasswordInput } from '../../components/PasswordInput';
import { useCredentialsValidate } from '../../hooks/useCredentialsValidate';
import { TAppSchema } from '../../models/schema';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants';

export const CameraStationSettings = () => {
    const { control } = useFormContext<TAppSchema>();
    const [areCredentialsValid] = useCredentialsValidate({
        protocol: 'acs_protocol',
        ipAddress: 'acs_ip',
        port: 'acs_port',
        user: 'acs_user',
        pass: 'acs_pass',
    });

    return (
        <Stack spacing={1.5}>
            <Title text="Camera Station Settings" />
            {/*------PROTOCOL------*/}
            <Controller
                name={`acs_protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        value={field.value}
                        onChange={(event) => {
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
            {/*------IP ADDRESS------*/}
            <Controller
                name={`acs_ip`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="IP address"
                        error={formState.errors.acs_ip !== undefined}
                        helperText={formState.errors.acs_ip?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
            {/*------PORT------*/}
            <Controller
                name={`acs_port`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="Port"
                        onChange={(e) => {
                            const val = parseValueAsInt(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                            field.onBlur();
                        }}
                        error={formState.errors.acs_port !== undefined}
                        helperText={
                            formState.errors.acs_port?.message
                                ? formState.errors.acs_port?.message
                                : 'Default ports are 29204 or 55756.'
                        }
                    />
                )}
            />
            {/*------USER------*/}
            <Controller
                name={`acs_user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="User"
                        error={formState.errors.acs_user !== undefined}
                        helperText={formState.errors.acs_user?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
            {/*------PASSWORD------*/}
            <PasswordInput name="acs_pass" areCredentialsValid={areCredentialsValid} control={control} />
            {/*------SOURCE KEY------*/}
            <Controller
                name={`acs_source_key`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="Source key"
                        error={formState.errors.acs_source_key !== undefined}
                        helperText={formState.errors.acs_source_key?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
        </Stack>
    );
};
