import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledRadioControlLabel, StyledForm } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { Radio, RadioGroup, FormHelperText } from '@mui/material';
import { PasswordInput } from '../../components/PasswordInput';
import { TAppSchema } from '../../models/schema';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants';

export const CameraStationSettings = () => {
    const { control } = useFormContext<TAppSchema>();

    return (
        <StyledForm>
            <Title text="Camera Station Settings" />
            {/* ------PROTOCOL------*/}
            <Controller
                name={`acs.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        value={field.value}
                        onChange={(e) => {
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
                name={`acs.ip`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="IP address"
                        error={formState.errors.acs?.ip !== undefined}
                        helperText={formState.errors.acs?.ip?.message}
                    />
                )}
            />
            {/* ------PORT------*/}
            <Controller
                name={`acs.port`}
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
                        error={formState.errors.acs?.port !== undefined}
                        helperText={formState.errors.acs?.port?.message}
                    />
                )}
            />
            <FormHelperText>Default ports are 29204 or 55756.</FormHelperText>
            {/* ------USER------*/}
            <Controller
                name={`acs.user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="User"
                        error={formState.errors.acs?.user !== undefined}
                        helperText={formState.errors.acs?.user?.message}
                    />
                )}
            />
            {/* ------PASSWORD------*/}
            <PasswordInput name="acs.pass" areCredentialsValid={true} control={control} />
            {/* ------SOURCE KEY------*/}
            <Controller
                name={`acs.source_key`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="Source key"
                        error={formState.errors.acs?.source_key !== undefined}
                        helperText={formState.errors.acs?.source_key?.message}
                    />
                )}
            />
        </StyledForm>
    );
};
