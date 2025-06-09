import { appInfo } from '../../appInfo';
import { parseValueAsFloat } from '../../utils';
import { PORT, PORT_LABELS } from '../constants';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledSelect, StyledForm } from '../../components/FormInputs';
import { MenuItem } from '@mui/material';
import { TSettings } from '../../models/schema';

export const RightAppSettings = () => {
    const { control } = useFormContext<TSettings>();

    return (
        <StyledForm>
            <Controller
                name={`camera.update_frequency`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        value={field.value}
                        fullWidth
                        label="Update Frequency"
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => {
                            const val = parseValueAsFloat(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                            field.onBlur();
                        }}
                        error={formState.errors.camera?.update_frequency !== undefined}
                        helperText={formState.errors.camera?.update_frequency?.message}
                    />
                )}
            />
            <Controller
                name={`camera.port_id`}
                control={control}
                render={({ field }) => (
                    <StyledSelect {...field} label={`${appInfo.name} port ID`}>
                        {PORT.map((value) => (
                            <MenuItem key={value} value={value}>
                                {PORT_LABELS[value]}
                            </MenuItem>
                        ))}
                    </StyledSelect>
                )}
            />
        </StyledForm>
    );
};
