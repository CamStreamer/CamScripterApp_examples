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

type Props = {
    name: 'camera' | 'conn_hub';
};

export const FormConnectParams = ({ name }: Props) => {
    const { control, setValue } = useFormContext<TServerData>();
    const [areCredentialsValid, isFetching, isCameraResponding, check, cameraSerialNumber] = useCredentialsValidate({
        name: name,
    });

    if (cameraSerialNumber !== null) {
        setValue('camera.serial_number', cameraSerialNumber as string);
    }

    return (
        <>
            {/* ------PROTOCOL------*/}
            <Controller
                name={`${name}.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        style={{ gridColumn: '2 span' }}
                        value={field.value}
                        onChange={(e) => {
                            const protocol = e.target.value;
                            setValue(`${name}.port`, protocol === 'http' ? 80 : 443, {
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
                        name={`${name}.ip`}
                        control={control}
                        render={({ field, formState }) => (
                            <FormInputWithDialog
                                {...field}
                                value={field.value}
                                error={!!formState.errors[name]?.ip}
                                helperText={formState.errors[name]?.ip?.message}
                            />
                        )}
                    />
                    {/* ------PORT------*/}
                    <Controller
                        name={`${name}.port`}
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
                                error={!!formState.errors[name]?.port}
                                helperText={formState.errors[name]?.port?.message}
                            />
                        )}
                    />
                    {/* ------CONNECTION CHECK------*/}
                    <ConnectionCheck
                        isFetching={isFetching}
                        isCameraResponding={isCameraResponding}
                        areCredentialsValid={areCredentialsValid}
                        name={name}
                        check={check}
                    />
                </StyledForm>
                <StyledForm>
                    {/* ------USER------*/}
                    <Controller
                        name={`${name}.user`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="User"
                                error={!!formState.errors[name]?.user}
                                helperText={formState.errors[name]?.user?.message}
                            />
                        )}
                    />
                    {/* ------PASSWORD------*/}
                    <PasswordInput control={control} name={`${name}.pass`} areCredentialsValid={areCredentialsValid} />
                </StyledForm>
            </StyledRow>
        </>
    );
};
