import { useState, forwardRef, ForwardedRef, useEffect } from 'react';
import { TCameraOption, useCameraOptions } from '../hooks/useCameraOptions';

import { Button, Box, Dialog, Divider, InputAdornment, List, ListItem, Typography } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { StyledTextField } from './FormInputs';
import { Title } from './Title';
import { ContainerLoader } from '../components/ContainerLoader';
import { Path, useFormContext } from 'react-hook-form';
import { TAppSchema } from '../models/schema';

type CameraProps = {
    open: boolean;
    cameraOptions: TCameraOption[];
    value: string;
    isFetching?: boolean;
    onClose: (value: string) => void;
};

type Props = {
    value: string;
    keyName: Path<TAppSchema>;
    helperText?: string;
    error?: boolean;
    onBlur?: () => void;
    onChange?: (ip: string) => void;
};

const CameraList = ({ onClose, open, value, cameraOptions, isFetching }: CameraProps) => {
    return (
        <StyledDialog onClose={() => onClose(value)} open={open}>
            <Title text="Network camera list" />
            {isFetching ? (
                <ContainerLoader size={80} infoText="Fetching camera list..." />
            ) : (
                <StyledList>
                    {cameraOptions.map((option) => (
                        <Box key={option.ip}>
                            <StyledListItem disableGutters key={option.ip}>
                                <>
                                    <Typography>{option.name}</Typography>
                                    <Typography>{option.ip}</Typography>
                                </>
                                <Button variant="contained" onClick={() => onClose(option.ip)}>
                                    SELECT
                                </Button>
                            </StyledListItem>
                            <Divider />
                        </Box>
                    ))}
                </StyledList>
            )}
        </StyledDialog>
    );
};

export const FormInputWithDialog = forwardRef(
    ({ value, keyName, onChange }: Props, ref: ForwardedRef<HTMLDivElement>) => {
        const [options, fetchCameraOptions, isFetching] = useCameraOptions();
        const { setValue } = useFormContext();
        const [open, setOpen] = useState(false);
        const [list, setList] = useState<TCameraOption[]>([]);

        const handleClickOpen = () => {
            fetchCameraOptions();
            setOpen(true);
        };

        const handleSelectCamera = (ip: string) => {
            setValue(keyName, ip);
            setOpen(false);
        };

        useEffect(() => {
            setList(options.length > 0 ? options : DEFAULT_CAMERA_LIST);
        }, [options]);

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
                            <CameraList
                                open={open}
                                value={value}
                                onClose={handleSelectCamera}
                                cameraOptions={list}
                                isFetching={isFetching}
                            />
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

const DEFAULT_CAMERA_LIST: TCameraOption[] = [
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '1.2.3.4.5' },
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '1.1.1.1.1' },
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '5.5.5.5.5' },
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '79.55.3.410.5' },
];
