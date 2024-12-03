import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { Stack } from '@mui/material';
import { TAppSchema } from '../../models/schema';

export const WidgetSettings = () => {
    const { control } = useFormContext<TAppSchema>();

    return (
        <Stack spacing={1.5}>
            <Title text="Widget settings" />
            {/* ------SERVICE ID------*/}
            <Controller
                name={`service_id`}
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
                            e.target.value = val.toString();
                        }}
                        error={formState.errors.service_id !== undefined}
                        helperText={formState.errors.service_id?.message}
                    />
                )}
            />
            {/* ------FIELD NAME------*/}
            <Controller
                name={`field_name`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="Field Name"
                        error={formState.errors.field_name !== undefined}
                        helperText={formState.errors.field_name?.message}
                    />
                )}
            />
        </Stack>
    );
};
