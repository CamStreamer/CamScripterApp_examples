import { Controller, useFormContext } from 'react-hook-form';
import { TSettingsSchema } from '../../models/schema';
import { InputAdornment, Radio, RadioGroup } from '@mui/material';
import { StyledTextField, StyledRadioControlLabel, StyledForm as FormSection } from '../../components/FormInputs';
import { parseValueAsFloat } from '../../utils';
import { OVERLAY_TYPES, OVERLAY_TYPES_LABELS } from '../constants/constants';
import { Title } from '../../components/Title';
import { styled } from '@mui/material/styles';

export const OverlaySettings = () => {
    const { control } = useFormContext<TSettingsSchema>();

    return (
        <StyledForm>
            <Title text="Choose overlay" />

            {/* ------OVERLAY TYPE------*/}
            <Controller
                name={'widget.overlay_type'}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        style={{ gridColumn: '2 span' }}
                        value={field.value}
                        onChange={(e) => {
                            field.onChange(e);
                        }}
                    >
                        {OVERLAY_TYPES.map((unit) => (
                            <StyledRadioControlLabel
                                key={unit}
                                value={unit}
                                control={<Radio color="info" />}
                                label={OVERLAY_TYPES_LABELS[unit]}
                            />
                        ))}
                    </RadioGroup>
                )}
            />

            {/* ------GLASS SIZE------*/}
            <Controller
                name={'widget.glass_size'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="Glass size"
                        InputLabelProps={{ shrink: true }}
                        onBlur={(e) => {
                            const val = parseValueAsFloat(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                        }}
                        error={!!formState.errors.widget?.glass_size}
                        helperText={formState.errors.widget?.glass_size?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" disableTypography>
                                    liters
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />
        </StyledForm>
    );
};

const StyledForm = styled(FormSection)`
    margin-top: 8px;
`;
