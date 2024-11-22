import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledRadioControlLabel } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { Stack, Radio, RadioGroup } from '@mui/material';
import { FormInputWithDialog } from '../../components/FormInputWithDialog';
import { PasswordInput } from '../../components/PasswordInput';
import { useCredentialsValidate } from '../../hooks/useCredentialsValidate';
import { TAppSchema } from '../../models/schema';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants';

export const EventsCameraSettings = () => {
    const { control, setValue } = useFormContext<TAppSchema>();
    const [areCredentialsValid] = useCredentialsValidate({
        protocol: 'event_camera_protocol',
        ipAddress: 'event_camera_ip',
        port: 'event_camera_port',
        user: 'event_camera_user',
        pass: 'event_camera_pass',
    });

    return (
        <Stack spacing={1.5}>
            <Title text="Camera Settings" />
            {/*------PROTOCOL------*/}
            <Controller
                name={`event_camera_protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        value={field.value}
                        onChange={(event) => {
                            const protocol = event.target.value;
                            setValue(`event_camera_port`, protocol === 'http' ? 80 : 443, {
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
            {/*------IP ADDRESS------*/}
            <Controller
                name={`event_camera_ip`}
                control={control}
                render={({ field, formState }) => (
                    <FormInputWithDialog
                        {...field}
                        value={field.value}
                        keyName="event_camera_ip"
                        error={!!formState.errors.event_camera_ip}
                        helperText={formState.errors.event_camera_ip?.message}
                    />
                )}
            />
            {/*------PORT------*/}
            <Controller
                name={`event_camera_port`}
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
                        error={formState.errors.event_camera_port !== undefined}
                        helperText={formState.errors.event_camera_port?.message}
                    />
                )}
            />
            {/*------USER------*/}
            <Controller
                name={`event_camera_user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="User"
                        error={formState.errors.event_camera_user !== undefined}
                        helperText={formState.errors.event_camera_user?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
            {/*------PASSWORD------*/}
            <PasswordInput name="event_camera_pass" areCredentialsValid={areCredentialsValid} control={control} />
        </Stack>
    );
};
