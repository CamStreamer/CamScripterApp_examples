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
        <StyledDialog fullWidth maxWidth="md" onClose={() => onClose(value)} open={open}>
            <Title text="Network camera list" />
            {isFetching ? (
                <ContainerLoader size={80} infoText="Fetching camera list..." />
            ) : (
                <StyledList>
                    {cameraOptions.map((option) => (
                        <StyledBox key={option.ip}>
                            <StyledListItem disableGutters key={option.ip}>
                                <StyledListDiv>
                                    <StyledTypography>{option.name}</StyledTypography>
                                    <StyledTypography>{option.ip}</StyledTypography>
                                </StyledListDiv>
                                <Button variant="contained" onClick={() => onClose(option.ip)}>
                                    SELECT
                                </Button>
                            </StyledListItem>
                            <Divider />
                        </StyledBox>
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
        width: 90%;
        max-width: 600px;
        margin: 0 auto;
        padding: 30px;

        @media (max-width: 600px) {
            padding: 16px;
        }
    }

    & .MuiDialogContent-root {
        padding: 20px;
    }

    & .MuiDialogActions-root {
        padding: 20px;
    }
`;

const StyledBox = styled(Box)`
    height: 48px;
    margin-bottom: 4px;

    & :hover {
        & button {
            opacity: 1;
            visibility: visible;
        }
    }

    & button {
        visibility: hidden;
    }
`;

const StyledListItem = styled(ListItem)`
    display: flex;
    justify-content: space-between;

    @media (max-width: 600px) {
    }
`;

const StyledList = styled(List)`
    padding: 8px;
`;

const StyledListDiv = styled('div')`
    display: flex;

    @media (max-width: 600px) {
        padding-right: 20px;
        align-items: center;
    }
`;

const StyledTypography = styled(Typography)`
    font-size: 0.9rem;
    margin-right: 50px;

    @media (max-width: 600px) {
        margin-right: 10px;
    }
`;

const DEFAULT_CAMERA_LIST: TCameraOption[] = [
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '192.168.91.213' },
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '192.168.91.214' },
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '192.168.91.215' },
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '192.168.91.216' },
];
