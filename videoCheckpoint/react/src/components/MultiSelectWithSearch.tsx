import React, { ForwardedRef, forwardRef, useState } from 'react';
import {
    Select,
    Checkbox,
    ListItemText,
    MenuItem,
    Popper,
    ClickAwayListener,
    Paper,
    Typography,
    TextField,
} from '@mui/material';
import List from 'rc-virtual-list';
import styled from '@mui/material/styles/styled';
import { StyledSelect } from './FormInputs';

type TCameraListOption = {
    index: number;
    value: string;
    label: string;
};

type Props = {
    cameraList?: TCameraListOption[];
    onChange?: (data: string[]) => void;
    reloadCameras: () => void;
    value: string[];
    helperText?: string;
    disabled?: boolean;
    error?: boolean;
};

export const MultiSelectWithSearch = forwardRef(
    ({ cameraList, disabled, onChange, reloadCameras, value }: Props, ref: ForwardedRef<typeof Select>) => {
        const list = cameraList ?? [];

        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const [popperWidth, setPopperWidth] = useState<number | undefined>(undefined);
        const [open, setOpen] = useState(false);
        const [filteredList, setFilteredList] = useState<TCameraListOption[]>(list);

        const handleSearch = (searchValue: string) => {
            const filtered = list.filter((option) => option.label.toLowerCase().includes(searchValue.toLowerCase()));
            setFilteredList(filtered);
        };

        const handleClick = (event: React.MouseEvent<HTMLElement>) => {
            if (list.length === 0) {
                return;
            }

            setAnchorEl(event.currentTarget);
            setPopperWidth(event.currentTarget.clientWidth);
            setOpen(true);
            setFilteredList(list);
        };

        const handleCheck = (optionValue: string) => {
            let newSelected: string[];
            if (value.includes(optionValue)) {
                newSelected = value.filter((v) => v !== optionValue);
            } else {
                newSelected = [...value, optionValue];
            }
            onChange?.(newSelected);
        };

        return (
            <>
                <StyledSelect
                    multiple
                    value={value}
                    label={'Bookmark Camera(s)'}
                    onClick={handleClick}
                    open={false}
                    renderValue={(selected) => {
                        if (list.length === 0) {
                            return value.join(', ');
                        }

                        return (selected as string[])
                            .map((v: string) => {
                                const selectedOption = list.find((o) => o.value === v);
                                return selectedOption?.label ?? '';
                            })
                            .filter((v: string) => !!v)
                            .join(', ');
                    }}
                    onFocus={() => {
                        setFilteredList(list);
                    }}
                    onOpen={() => reloadCameras()}
                    disabled={disabled ?? list.length === 0}
                    ref={ref}
                    fullWidth
                />

                <StyledPopper open={open} anchorEl={anchorEl} placement="top-start" $popperWidth={popperWidth}>
                    <ClickAwayListener onClickAway={() => setOpen(false)}>
                        <Paper>
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
                                <List
                                    data={filteredList}
                                    height={250}
                                    itemHeight={30}
                                    itemKey={(option) => option.value}
                                >
                                    {(option: TCameraListOption) => (
                                        <MenuItem key={option.value} onClick={() => handleCheck(option.value)} dense>
                                            <Checkbox checked={value.indexOf(option.value) > -1} size="small" />
                                            <ListItemText primary={option.label} />
                                        </MenuItem>
                                    )}
                                </List>
                            ) : (
                                <StyledTypography>No cameras found</StyledTypography>
                            )}
                        </Paper>
                    </ClickAwayListener>
                </StyledPopper>
            </>
        );
    }
);

MultiSelectWithSearch.displayName = 'MultiSelectWithSearch';

const StyledSearchbar = styled(TextField)`
    margin: 8px;
    width: 96%;
`;

const StyledTypography = styled(Typography)`
    padding: 10px;
    margin: 10px;
`;

const StyledPopper = styled(Popper)<{ $popperWidth?: number }>(({ $popperWidth }) => ({
    width: $popperWidth !== undefined ? `${$popperWidth}px` : 'auto',
    zIndex: 1300,
}));
