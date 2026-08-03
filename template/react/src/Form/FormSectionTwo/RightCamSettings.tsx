import { Controller, useFormContext } from 'react-hook-form';
import { TSettings } from '../../models/schema';
import { StyledTextField, StyledForm } from '../../components/FormInputs';
import { parseValueAsInt } from '../../utils';
import { Title } from '../../components/Title';

export const RightCamSettings = () => {
    const { control } = useFormContext<TSettings>();

    return (
        <StyledForm>
            <Title text="Custom Graphics Widget settings" />
            <Controller
                name={`output_camera.service_id`}
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
                        label="Service ID"
                        error={formState.errors.output_camera?.service_id !== undefined}
                        helperText={formState.errors.output_camera?.service_id?.message}
                    />
                )}
            />
            <Controller
                name={`output_camera.field_name`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="Field Name"
                        error={formState.errors.output_camera?.field_name !== undefined}
                        helperText={formState.errors.output_camera?.field_name?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
        </StyledForm>
    );
};
