import { Checkbox, ListItemText, MenuItem, Select } from '@mui/material';
import { StyledSelect } from './FormInputs';
import { TCameraListOption } from '../hooks/useCameraList';
import { ForwardedRef, forwardRef } from 'react';

type Props = {
    viewAreaList?: TCameraListOption[];
    onChange?: (data: TCameraListOption[]) => void;
    value: { value: number; label: string }[];
    helperText?: string;
    disabled?: boolean;
    error?: boolean;
};

export const ViewAreaPicker = forwardRef(
    ({ viewAreaList, disabled, onChange, value }: Props, ref: ForwardedRef<typeof Select>) => {
        const list = viewAreaList ?? DEFAULT_VALUES;

        return (
            <StyledSelect
                multiple
                value={value.map((item) => item.value)}
                label="View area(s)"
                renderValue={(selected) => {
                    if (list.length === 0) {
                        return value.map((v) => v.label).join(', ');
                    } else {
                        return (selected as number[])
                            .map((v: number) => {
                                const selectedOptions = list.find((o) => o.value === v);
                                return selectedOptions?.label ?? '';
                            })
                            .filter((v: string) => !!v)
                            .join(', ');
                    }
                }}
                onChange={(e) => {
                    const selectedValues = e.target.value as number[];
                    const selectedOptions = list.filter((option) => selectedValues.includes(option.value));
                    onChange?.(selectedOptions);
                }}
                disabled={disabled ?? list.length === 0}
                ref={ref}
            >
                {list.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        <Checkbox checked={value.some((selected) => selected.value === option.value)} />
                        <ListItemText primary={option.label} />
                    </MenuItem>
                ))}
            </StyledSelect>
        );
    }
);

const DEFAULT_VALUES: TCameraListOption[] = [
    { value: 0, label: 'View Area 1' },
    { value: 1, label: 'View Area 2' },
    { value: 2, label: 'View Area 3' },
    { value: 3, label: 'View Area 4' },
];
