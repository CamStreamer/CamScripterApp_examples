import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledRadioControlLabel } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { Stack, Radio, RadioGroup } from '@mui/material';
import { FormInputWithDialog } from '../../components/FormInputWithDialog';
import { PasswordInput } from '../../components/PasswordInput';
import { ConnectionCheck } from '../../components/ConnectionCheck';
import { useCredentialsValidate } from '../../hooks/useCredentialsValidate';
import { TAppSchema } from '../../models/schema';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants';

export const IntegrationDeviceSettings = () => {
    const { control, setValue } = useFormContext<TAppSchema>();
    const [areCredentialsValid] = useCredentialsValidate({
        protocol: 'camera_protocol',
        ipAddress: 'camera_ip',
        port: 'camera_port',
        user: 'camera_user',
        pass: 'camera_pass',
    });

    return (
        <Stack spacing={1.5}>
            <Title text="Device Settings" />
            {/* ------PROTOCOL------*/}
            <Controller
                name={`camera_protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        value={field.value}
                        onChange={(event) => {
                            const protocol = event.target.value;
                            setValue(`camera_port`, protocol === 'http' ? 80 : 443, {
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
            {/* ------IP ADDRESS------*/}
            <Controller
                name={`camera_ip`}
                control={control}
                render={({ field, formState }) => (
                    <FormInputWithDialog
                        {...field}
                        value={field.value}
                        error={!!formState.errors.camera_ip}
                        helperText={formState.errors.camera_ip?.message}
                    />
                )}
            />
            {/* ------PORT------*/}
            <Controller
                name={`camera_port`}
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
                        error={formState.errors.camera_port !== undefined}
                        helperText={formState.errors.camera_port?.message}
                    />
                )}
            />
            {/* ------USER------*/}
            <Controller
                name={`camera_user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="User"
                        error={formState.errors.camera_user !== undefined}
                        helperText={formState.errors.camera_user?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
            {/* ------PASSWORD------*/}
            <PasswordInput name="camera_pass" areCredentialsValid={areCredentialsValid} control={control} />
            {/* ------CONNECTION CHECK------*/}
            <ConnectionCheck
                protocol="camera_protocol"
                port="camera_port"
                ipAddress="camera_ip"
                areCredentialsValid={areCredentialsValid}
                credentials={['camera_user', 'camera_pass']}
            />
        </Stack>
    );
};