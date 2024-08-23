import { Checkbox, ListItemText, MenuItem, Select } from '@mui/material';
import { StyledSelect } from './FormInputs';
import { TCameraListOption } from '../hooks/useCameraList';
import { ForwardedRef, forwardRef } from 'react';

type Props = {
    viewAreaList?: TCameraListOption[];
    onChange?: (data: number[]) => void;
    value: number[];
    helperText?: string;
    disabled?: boolean;
    error?: boolean;
};

const ViewAreaPickerWithRef = (
    { viewAreaList, disabled, onChange, value }: Props,
    ref: ForwardedRef<typeof Select>
) => {
    const list = viewAreaList ?? DEFAULT_VALUES;

    return (
        <StyledSelect
            multiple
            value={value}
            label={'View area'}
            renderValue={(selected) => {
                return (selected as number[])
                    .map((v: number) => {
                        const selectedOptions = list.find((o) => o.value === v);
                        return selectedOptions?.label ?? '';
                    })
                    .filter((v: string) => !!v)
                    .join(', ');
            }}
            onChange={(e) => {
                const val = e.target.value;
                const toSave = typeof val === 'string' ? [] : val;
                onChange?.(toSave as number[]);
            }}
            disabled={disabled ?? list.length === 0}
            ref={ref}
        >
            {list.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                    <Checkbox checked={value.indexOf(option.value) > -1} />
                    <ListItemText primary={option.label} />
                </MenuItem>
            ))}
        </StyledSelect>
    );
};
export const ViewAreaPicker = forwardRef(ViewAreaPickerWithRef);

const DEFAULT_VALUES: TCameraListOption[] = [
    { value: 0, label: 'View Area 1' },
    { value: 1, label: 'View Area 2' },
    { value: 2, label: 'View Area 3' },
    { value: 3, label: 'View Area 4' },
];
