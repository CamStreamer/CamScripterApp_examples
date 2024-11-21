import { Controller, useFormContext } from 'react-hook-form';
import { TSettings } from '../../models/schema';
import { StyledTextField } from '../../components/FormInputs';
import { parseValueAsInt } from '../../utils';
import { Title } from '../../components/Title';
import { Stack } from '@mui/material';

type Props = {
    name: 'camera';
    onBlur?: () => void;
};
export const RightCamSettings = ({ onBlur, name }: Props) => {
    const { control } = useFormContext<TSettings>();

    return (
        <Stack spacing={1.5}>
            <Title text="Custom Graphics Widget settings" />
            <Controller
                name={`${name}.serviceID`}
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
                            onBlur?.();
                        }}
                        fullWidth
                        label="Service ID"
                        error={formState.errors[name]?.serviceID !== undefined}
                        helperText={formState.errors[name]?.serviceID?.message}
                    />
                )}
            />
            <Controller
                name={`${name}.fieldName`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="Field Name"
                        error={formState.errors[name]?.fieldName !== undefined}
                        helperText={formState.errors[name]?.fieldName?.message}
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
