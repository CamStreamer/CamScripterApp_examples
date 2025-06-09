import { Controller, useFormContext } from 'react-hook-form';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants';
import { TSettings } from '../../models/schema';
import { useCredentialsValidate } from '../../hooks/useCredentialsValidate';
import { Radio, RadioGroup } from '@mui/material';
import { StyledTextField, StyledRadioControlLabel, StyledForm } from '../../components/FormInputs';
import { PasswordInput } from '../../components/PasswordInput';
import { parseValueAsInt } from '../../utils';
import { Title } from '../../components/Title';

export const LeftCamSettings = () => {
    const { control, setValue } = useFormContext<TSettings>();
    const [areCredentialsValid] = useCredentialsValidate({ name: 'output_camera' });

    return (
        <StyledForm>
            <Title text="Camera Connection Settings" />
            <Controller
                name={`output_camera.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        value={field.value}
                        onChange={(event) => {
                            const protocol = event.target.value;
                            setValue(`output_camera.port`, protocol === 'http' ? 80 : 443, {
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
            <Controller
                name={`output_camera.ip`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="IP address"
                        error={formState.errors.output_camera?.ip !== undefined}
                        helperText={formState.errors.output_camera?.ip?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
            <Controller
                name={`output_camera.port`}
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
                        }}
                        fullWidth
                        label="Port"
                        error={formState.errors.output_camera?.port !== undefined}
                        helperText={formState.errors.output_camera?.port?.message}
                    />
                )}
            />
            <Controller
                name={`output_camera.user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="User"
                        error={formState.errors.output_camera?.user !== undefined}
                        helperText={formState.errors.output_camera?.user?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
            <PasswordInput areCredentialsValid={areCredentialsValid} control={control} name={'output_camera'} />
        </StyledForm>
    );
};
