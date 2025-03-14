import { parseValueAsInt } from '../../utils';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledRadioControlLabel, StyledForm } from '../../components/FormInputs';
import { Radio, RadioGroup } from '@mui/material';
import { TSettings } from '../../models/schema';

export const LeftAppSettings = () => {
    const { control, setValue } = useFormContext<TSettings>();

    return (
        <StyledForm>
            <Controller
                name={`camera.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        value={field.value}
                        onChange={(event) => {
                            const protocol = event.target.value;
                            setValue(`camera.port`, protocol === 'http' ? 80 : 443, {
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
                name={`camera.ip`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="IP address"
                        error={formState.errors.camera?.ip !== undefined}
                        helperText={formState.errors.camera?.ip?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
            <Controller
                name={`camera.port`}
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
                        error={formState.errors.camera?.port !== undefined}
                        helperText={formState.errors.camera?.port?.message}
                    />
                )}
            />
        </StyledForm>
    );
};
