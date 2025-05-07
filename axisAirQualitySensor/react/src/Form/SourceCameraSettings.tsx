import { Controller, useFormContext } from 'react-hook-form';
import { TServerData } from '../models/schema';
import { Radio, RadioGroup } from '@mui/material';
import { StyledTextField, StyledRadioControlLabel, StyledForm, StyledRow } from '../components/FormInputs';
import { FormInputWithDialog } from '../components/FormInputWithDialog';
import { PasswordInput } from '../components/PasswordInput';
import { ConnectionCheck } from '../components/ConnectionCheck';
import { useCredentialsValidate } from '../hooks/useCredentialsValidate';
import { parseValueAsInt } from '../utils';
import { PROTOCOLS, PROTOCOL_LABELS } from './constants/constants';

export const SourceCameraSettings = () => {
    const { control, setValue } = useFormContext<TServerData>();
    const [areCredentialsValid, isFetching, isCameraResponding, check, _] = useCredentialsValidate({
        name: 'source_camera',
    });

    return (
        <>
            {/* ------PROTOCOL------*/}
            <Controller
                name={`source_camera.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        style={{ gridColumn: '2 span' }}
                        value={field.value}
                        onChange={(e) => {
                            const protocol = e.target.value;
                            setValue(`source_camera.port`, protocol === 'http' ? 80 : 443, {
                                shouldTouch: true,
                            });
                            field.onChange(e);
                        }}
                    >
                        {PROTOCOLS.map((protocol) => (
                            <StyledRadioControlLabel
                                key={protocol}
                                value={protocol}
                                control={<Radio color="info" />}
                                label={PROTOCOL_LABELS[protocol]}
                            />
                        ))}
                    </RadioGroup>
                )}
            />
            <StyledRow>
                <StyledForm>
                    {/* ------IP ADDRESS------*/}
                    <Controller
                        name={`source_camera.ip`}
                        control={control}
                        render={({ field, formState }) => (
                            <FormInputWithDialog
                                {...field}
                                value={field.value}
                                error={!!formState.errors.source_camera?.ip}
                                helperText={formState.errors.source_camera?.ip?.message}
                            />
                        )}
                    />
                    {/* ------PORT------*/}
                    <Controller
                        name={`source_camera.port`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                InputLabelProps={{ shrink: true }}
                                onBlur={(e) => {
                                    const val = parseValueAsInt(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                fullWidth
                                label="Port"
                                error={!!formState.errors.source_camera?.port}
                                helperText={formState.errors.source_camera?.port?.message}
                            />
                        )}
                    />
                    {/* ------CONNECTION CHECK------*/}
                    <ConnectionCheck
                        isFetching={isFetching}
                        isCameraResponding={isCameraResponding}
                        areCredentialsValid={areCredentialsValid}
                        name={'source_camera'}
                        check={check}
                    />
                </StyledForm>
                <StyledForm>
                    {/* ------USER------*/}
                    <Controller
                        name={`source_camera.user`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="User"
                                error={!!formState.errors.source_camera?.user}
                                helperText={formState.errors.source_camera?.user?.message}
                            />
                        )}
                    />

                    {/* ------PASSWORD------*/}
                    <PasswordInput
                        control={control}
                        name={`source_camera.pass`}
                        areCredentialsValid={areCredentialsValid}
                    />
                </StyledForm>
            </StyledRow>
        </>
    );
};
