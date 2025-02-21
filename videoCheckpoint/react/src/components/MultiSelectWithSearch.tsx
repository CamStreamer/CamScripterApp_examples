import styled from '@mui/material/styles/styled';
import { Checkbox, ListItemText, MenuItem, Select, TextField } from '@mui/material';
import { StyledSelect } from './FormInputs';
import { ForwardedRef, forwardRef, useState } from 'react';
import { TCameraListOption } from '../hooks/useGenetecConnection';

type Props = {
    cameraList?: TCameraListOption[];
    onChange?: (data: number[]) => void;
    value: number[];
    helperText?: string;
    disabled?: boolean;
    error?: boolean;
};

export const MultiSelectWithSearch = forwardRef(
    ({ cameraList, disabled, onChange, value }: Props, ref: ForwardedRef<typeof Select>) => {
        const list = cameraList ?? [];

        const [filteredList, setFilteredList] = useState<TCameraListOption[]>(list);

        const handleSearch = (value: string) => {
            const filtered = list.filter((option) => option.label.toLowerCase().includes(value.toLowerCase()));
            setFilteredList(filtered);
        };

        return (
            <StyledSelect
                multiple
                value={value}
                label={'Bookmark Camera(s)'}
                renderValue={(selected) => {
                    return (selected as number[])
                        .map((v: number) => {
                            const selectedOptions = list.find((o) => o.index === v);
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
                onFocus={() => {
                    setFilteredList(list);
                }}
                MenuProps={MenuProps}
            >
                <StyledSearchbar
                    variant="outlined"
                    placeholder="Search"
                    onChange={(e) => {
                        handleSearch(e.target.value);
                        e.stopPropagation();
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                    }}
                />

                {filteredList.length > 0 ? (
                    filteredList.map((option) => (
                        <MenuItem key={option.value} value={option.index}>
                            <Checkbox checked={value.indexOf(option.index) > -1} />
                            <ListItemText primary={option.label} />
                        </MenuItem>
                    ))
                ) : (
                    <MenuItem value={''} disabled>
                        No cameras found
                    </MenuItem>
                )}
            </StyledSelect>
        );
    }
);

MultiSelectWithSearch.displayName = 'MultiSelectWithSearch';

const StyledSearchbar = styled(TextField)`
    position: sticky;
    top: 10px;
    z-index: 1;
    background-color: white;
    margin: 2px 0px 10px 11px;
    width: 96%;
`;

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: 230,
        },
    },
};
