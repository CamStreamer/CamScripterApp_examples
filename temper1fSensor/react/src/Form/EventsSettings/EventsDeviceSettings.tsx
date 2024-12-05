import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledRadioControlLabel, StyledBox, StyledConnectionChip } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { Button, Typography, Stack, Radio, RadioGroup } from '@mui/material';
import { FormInputWithDialog } from '../../components/FormInputWithDialog';
import { PasswordInput } from '../../components/PasswordInput';
import { useCredentialsValidate } from '../../hooks/useCredentialsValidate';
import { useCheckConnection } from '../../hooks/useCheckConnection';
import { TAppSchema } from '../../models/schema';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants';

export const EventsDeviceSettings = () => {
    const { control, setValue } = useFormContext<TAppSchema>();
    const [areCredentialsValid] = useCredentialsValidate({
        name: 'event_camera',
        path: '/axis-cgi/param.cgi',
    });

    const [isCameraResponding, isFetchingConnection, validate] = useCredentialsValidate({
        name: 'event_camera',
        path: '/axis-cgi/basicdeviceinfo.cgi',
    });

    const [isDisabled, getLabelText, getChipClass] = useCheckConnection({
        isFetchingConnection,
        isCameraResponding,
        areCredentialsValid,
        name: 'event_camera',
    });

    return (
        <Stack spacing={1.5}>
            <Title text="Device Settings" />
            {/* ------PROTOCOL------*/}
            <Controller
                name={`event_camera_protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        value={field.value}
                        onChange={(e) => {
                            const protocol = e.target.value;
                            setValue(`event_camera_port`, protocol === 'http' ? 80 : 443, {
                                shouldTouch: true,
                            });
                            field.onChange(e);
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
                name={`event_camera_ip`}
                control={control}
                render={({ field, formState }) => (
                    <FormInputWithDialog
                        {...field}
                        value={field.value}
                        error={!!formState.errors.event_camera_ip}
                        helperText={formState.errors.event_camera_ip?.message}
                    />
                )}
            />
            {/* ------PORT------*/}
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
                        }}
                        error={formState.errors.event_camera_port !== undefined}
                        helperText={formState.errors.event_camera_port?.message}
                    />
                )}
            />
            {/* ------USER------*/}
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
                    />
                )}
            />
            {/* ------PASSWORD------*/}
            <PasswordInput name="event_camera_pass" areCredentialsValid={areCredentialsValid} control={control} />
            {/* ------CONNECTION CHECK------*/}
            <StyledBox>
                <Typography fontWeight={700}>Connection</Typography>
                <StyledConnectionChip color={getChipClass()} label={getLabelText()} />
                <Button variant="outlined" onClick={validate} disabled={isDisabled}>
                    Check
                </Button>
            </StyledBox>
        </Stack>
    );
};
