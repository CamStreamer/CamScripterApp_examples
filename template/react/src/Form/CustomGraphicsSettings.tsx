import { Controller, useFormContext } from 'react-hook-form';
import { TSettings } from '../models/schema';
import { StyledTextField } from '../components/FormInputs';
import { parseValueAsInt } from '../utils';
import { Title } from '../components/Title';
import { Stack } from '@mui/material';

type Props = {
    onBlur?: () => void;
};
export const CustomGraphicsSettings = ({ onBlur }: Props) => {
    const { control } = useFormContext<TSettings>();
    return (
        <Stack spacing={1.5}>
            <Title text="Custom Graphics Widget settings" />
            <Controller
                name={`camera.serviceID`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        defaultValue={field.value}
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => {
                            const val = parseValueAsInt(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                            field.onBlur();
                            onBlur?.();
                        }}
                        fullWidth
                        label="Service ID"
                        error={formState.errors.camera?.serviceID !== undefined}
                        helperText={formState.errors.camera?.serviceID?.message}
                    />
                )}
            />
            <Controller
                name={`camera.fieldName`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="Field Name"
                        error={formState.errors.camera?.fieldName !== undefined}
                        helperText={formState.errors.camera?.fieldName?.message}
                        onBlur={() => {
                            field.onBlur();
                            onBlur?.();
                        }}
                    />
                )}
            />
        </Stack>
    );
};
