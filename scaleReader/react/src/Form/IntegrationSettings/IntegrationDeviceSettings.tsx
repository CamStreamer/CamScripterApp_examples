import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledRadioControlLabel, StyledBox, StyledConnectionChip } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { Button, Stack, Radio, RadioGroup, Typography } from '@mui/material';
import { FormInputWithDialog } from '../../components/FormInputWithDialog';
import { PasswordInput } from '../../components/PasswordInput';
import { useCredentialsValidate } from '../../hooks/useCredentialsValidate';
import { useCheckConnection } from '../../hooks/useCheckConnection';
import { TAppSchema } from '../../models/schema';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants';

export const IntegrationDeviceSettings = () => {
    const { control, setValue } = useFormContext<TAppSchema>();
    const [areCredentialsValid, isFetching, isCameraResponding, check] = useCredentialsValidate({
        name: 'camera',
    });

    const [isDisabled, getLabelText, getChipClass] = useCheckConnection({
        isFetching,
        isCameraResponding,
        areCredentialsValid,
        name: 'camera',
    });

    return (
        <Stack spacing={1.5}>
            <Title text="Device Settings" />
            {/* ------PROTOCOL------*/}
            <Controller
                name={`camera.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        value={field.value}
                        onChange={(e) => {
                            const protocol = e.target.value;
                            setValue(`camera.port`, protocol === 'http' ? 80 : 443, {
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
                name={`camera.ip`}
                control={control}
                render={({ field, formState }) => (
                    <FormInputWithDialog
                        {...field}
                        value={field.value}
                        error={!!formState.errors.camera?.ip}
                        helperText={formState.errors.camera?.ip?.message}
                    />
                )}
            />
            {/* ------PORT------*/}
            <Controller
                name={`camera.port`}
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
                        error={formState.errors.camera?.port !== undefined}
                        helperText={formState.errors.camera?.port?.message}
                    />
                )}
            />
            {/* ------USER------*/}
            <Controller
                name={`camera.user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="User"
                        error={formState.errors.camera?.user !== undefined}
                        helperText={formState.errors.camera?.user?.message}
                    />
                )}
            />
            {/* ------PASSWORD------*/}
            <PasswordInput name="camera.pass" areCredentialsValid={areCredentialsValid} control={control} />
            {/* ------CONNECTION CHECK------*/}
            <StyledBox>
                <Typography fontWeight={700}>Connection</Typography>
                <StyledConnectionChip color={getChipClass()} label={getLabelText()} />
                <Button variant="outlined" onClick={check} disabled={isDisabled}>
                    Check
                </Button>
            </StyledBox>
        </Stack>
    );
};
