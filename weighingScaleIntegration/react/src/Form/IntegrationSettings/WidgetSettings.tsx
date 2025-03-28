import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledForm } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { TAppSchema } from '../../models/schema';

export const WidgetSettings = () => {
    const { control } = useFormContext<TAppSchema>();

    return (
        <StyledForm>
            <Title text="Widget settings" />
            {/* ------SERVICE ID------*/}
            <Controller
                name={`camera.service_id`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="Service ID"
                        onChange={(e) => {
                            const val = parseValueAsInt(e.target.value);
                            field.onChange(val);
                        }}
                        error={formState.errors.camera?.service_id !== undefined}
                        helperText={formState.errors.camera?.service_id?.message}
                    />
                )}
            />
            {/* ------VALUE FIELD NAME------*/}
            <Controller
                name={`camera.value_field_name`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="Value Field Name"
                        error={formState.errors.camera?.value_field_name !== undefined}
                        helperText={formState.errors.camera?.value_field_name?.message}
                    />
                )}
            />
            {/* ------UNIT FIELD NAME------*/}
            <Controller
                name={`camera.unit_field_name`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="Unit Field Name"
                        error={formState.errors.camera?.unit_field_name !== undefined}
                        helperText={formState.errors.camera?.unit_field_name?.message}
                    />
                )}
            />
        </StyledForm>
    );
};
