import { appInfo } from '../../appInfo';
import { parseValueAsFloat } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledSelect } from '../../components/FormInputs';
import { Stack, MenuItem } from '@mui/material';
import { TSettings } from '../../models/schema';

type Props = {
    name: 'application';
    onBlur?: () => void;
};

export const RightAppSettings = ({ onBlur, name }: Props) => {
    const { control } = useFormContext<TSettings>();

    return (
        <Stack spacing={1.5}>
            <Controller
                name={`${name}.updateFrequency`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        value={field.value}
                        fullWidth
                        label="Update Frequency"
                        InputLabelProps={{ shrink: true }}
                        onBlur={(e) => {
                            const val = parseValueAsFloat(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                            field.onBlur();
                            onBlur?.();
                        }}
                        error={formState.errors[name]?.updateFrequency !== undefined}
                        helperText={formState.errors[name]?.updateFrequency?.message}
                    />
                )}
            />
            <Controller
                name={`${name}.portID`}
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
        </Stack>
    );
};

const PORT_LABELS: Record<string, string> = {
    1: 'A',
    2: 'B',
};
const PORT = Object.keys(PORT_LABELS);
