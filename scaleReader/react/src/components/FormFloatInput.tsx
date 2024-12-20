import { Control, Controller, Path } from 'react-hook-form';
import { StyledTextField } from './FormInputs';

type Props<Schema extends Record<string, unknown>> = {
    control: Control<Schema>;
    name: Path<Schema>;
};

export const FormFloatInput = <Schema extends Record<string, unknown>>({ control, name }: Props<Schema>) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field, formState }) => (
                <StyledTextField
                    {...field}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    label="Value"
                    onBlur={(e) => {
                        field.onChange((+e.target.value).toString());
                    }}
                    onChange={(e) => {
                        if (e.target.value === '') {
                            field.onChange('');
                            return;
                        }
                        if (e.target.value.match(/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/)) {
                            field.onChange(e.target.value);
                        }
                    }}
                    error={formState.errors.event_condition_value !== undefined}
                    helperText={formState.errors.event_condition_value?.message as string | undefined}
                />
            )}
        />
    );
};
