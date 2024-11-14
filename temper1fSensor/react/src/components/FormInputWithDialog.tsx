import { useState, forwardRef, ForwardedRef } from 'react';

import { Button, Dialog, Divider, InputAdornment, List, ListItem, Select, Typography } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { StyledTextField } from './FormInputs';
import { Title } from './Title';
import { Path, useFormContext } from 'react-hook-form';
import { TAppSchema } from '../models/schema';

export type TCameraOption = {
    id: number;
    model: string;
    ip: string;
};

type CameraProps = {
    open: boolean;
    cameraOptions: TCameraOption[];
    value: string;
    onClose: (value: string) => void;
};

type Props = {
    cameraOptions?: TCameraOption[];
    value: string;
    keyName: Path<TAppSchema>;
    onBlur?: () => void;
    onChange?: (ip: string) => void;
};

const CameraList = ({ onClose, open, value, cameraOptions }: CameraProps) => {
    return (
        <StyledDialog onClose={() => onClose(value)} open={open}>
            <Title text="Network camera list" />
            <StyledList>
                {cameraOptions.map((option) => (
                    <>
                        <StyledListItem disableGutters key={option.id}>
                            <>
                                <Typography variant="body2">{option.model}</Typography>
                                <Typography variant="body2">{option.ip}</Typography>
                            </>
                            <Button variant="contained" onClick={() => onClose(option.ip)}>
                                SELECT
                            </Button>
                        </StyledListItem>
                        <Divider />
                    </>
                ))}
            </StyledList>
        </StyledDialog>
    );
};

export const FormInputWithDialog = forwardRef(
    ({ cameraOptions, value, keyName, onChange }: Props, ref: ForwardedRef<typeof Select>) => {
        const { setValue } = useFormContext();
        const [open, setOpen] = useState(false);
        const list = cameraOptions ?? DEFAULT_CAMERA_LIST;

        const handleClickOpen = () => {
            setOpen(true);
        };

        const handleSelectCamera = (ip: string) => {
            setValue(keyName, ip);
            setOpen(false);
        };

        return (
            <StyledTextField
                value={value}
                type="text"
                fullWidth
                label="IP Address"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <Button variant="text" onClick={handleClickOpen}>
                                FIND CAMERA
                            </Button>
                            <CameraList open={open} value={value} onClose={handleSelectCamera} cameraOptions={list} />
                        </InputAdornment>
                    ),
                }}
                onChange={(e) => {
                    onChange?.(e.target.value as string);
                }}
                ref={ref}
            />
        );
    }
);

const DEFAULT_CAMERA_LIST: TCameraOption[] = [
    { id: 0, model: 'AXIS A8105-E - ACC8EFF250F', ip: '1.2.3.4.5' },
    { id: 1, model: 'AXIS A8105-E - ACC8EFF250F', ip: '1.1.1.1.1' },
    { id: 2, model: 'AXIS A8105-E - ACC8EFF250F', ip: '5.5.5.5.5' },
    { id: 3, model: 'AXIS A8105-E - ACC8EFF250F', ip: '79.55.3.410.5' },
];

const StyledDialog = styled(Dialog)`
    & .MuiDialog-paper {
        width: 30%;
        max-width: 90vw;
        margin: 0 auto;
        padding: 30px;
    }
    & .MuiDialogContent-root {
        padding: 20px;
    }
    & .MuiDialogActions-root {
        padding: 20px;
    }
`;

const StyledListItem = styled(ListItem)`
    display: flex;
    justify-content: space-between;
`;

const StyledList = styled(List)`
    padding: 8px;
`;
