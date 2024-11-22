import { useState, forwardRef, ForwardedRef, useEffect } from 'react';
import { TCameraOption, useCameraOptions } from '../hooks/useCameraOptions';

import { Button, Box, Dialog, Divider, InputAdornment, List, ListItem, Typography } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { StyledTextField } from './FormInputs';
import { Title } from './Title';
import { ContainerLoader } from '../components/ContainerLoader';
import { Path } from 'react-hook-form';
import { TAppSchema } from '../models/schema';

type CameraProps = {
    open: boolean;
    cameraOptions: TCameraOption[];
    value: string;
    isFetching?: boolean;
    onClose: (value: string) => void;
    handleFetch: () => void;
};

type Props = {
    value: string;
    keyName: Path<TAppSchema>;
    helperText?: string;
    error?: boolean;
    onBlur?: () => void;
    onChange?: (ip: string) => void;
};

const CameraList = ({ onClose, open, value, cameraOptions, isFetching, handleFetch }: CameraProps) => {
    return (
        <StyledDialog fullWidth maxWidth="md" onClose={() => onClose(value)} open={open}>
            <Title text="Network device list" />
            {isFetching ? (
                <ContainerLoader size={80} infoText="Fetching device list..." />
            ) : (
                <List>
                    {cameraOptions.length === 0 ? (
                        <StyledTypographyBox>
                            No device found. Try it <StyledLink onClick={handleFetch}>again</StyledLink>.
                        </StyledTypographyBox>
                    ) : (
                        cameraOptions.map((option) => (
                            <StyledBox key={option.name}>
                                <StyledListItem disableGutters key={option.name}>
                                    <StyledListDiv>
                                        <StyledTypography variant="body2">{option.name}</StyledTypography>
                                        <Typography variant="body2">{option.ip}</Typography>
                                    </StyledListDiv>
                                    <StyledButton variant="contained" color="info" onClick={() => onClose(option.ip)}>
                                        SELECT
                                    </StyledButton>
                                </StyledListItem>
                                <Divider />
                            </StyledBox>
                        ))
                    )}
                </List>
            )}
        </StyledDialog>
    );
};

export const FormInputWithDialog = forwardRef(({ value, onChange }: Props, ref: ForwardedRef<HTMLDivElement>) => {
    const [options, fetchCameraOptions, isFetching] = useCameraOptions();
    const [open, setOpen] = useState(false);
    const [list, setList] = useState<TCameraOption[]>([]);

    const handleClickOpen = () => {
        setOpen(true);
        fetchCameraOptions();
    };

    const handleSelectCamera = (ip: string) => {
        onChange?.(ip);
        setOpen(false);
    };

    useEffect(() => {
        if (options) {
            setList(options);
        }
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
                        <Button variant="text" color="info" onClick={handleClickOpen}>
                            <Typography variant="button" fontWeight={700}>
                                FIND DEVICE
                            </Typography>
                        </Button>
                        <CameraList
                            open={open}
                            value={value}
                            onClose={handleSelectCamera}
                            handleFetch={fetchCameraOptions}
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
});

const StyledDialog = styled(Dialog)`
    & .MuiDialog-paper {
        width: 90%;
        max-width: 600px;
        max-height: 584px;
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
    height: 52px;
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
    align-items: center;
    justify-content: space-between;
`;

const StyledListDiv = styled('div')`
    display: flex;
    align-items: center;

    @media (max-width: 600px) {
        padding-right: 20px;
        align-items: center;
    }

    @media (max-width: 530px) {
        padding-right: 16px;
        align-items: center;
    }
`;

const StyledTypography = styled(Typography)`
    padding: 0 16px;
    width: 250px;
    margin-right: 16px;
    font-variant-numeric: ordinal;

    @media (max-width: 600px) {
        margin-right: 10px;
    }

    @media (max-width: 530px) {
        width: 120px;
        margin: 0;
        padding: 0 10px;
    }
`;

const StyledButton = styled(Button)`
    margin-right: 30px;

    @media (max-width: 530px) {
        margin: 0 16px;
    }
`;

const StyledLink = styled('span')`
    text-decoration: underline;
    cursor: pointer;
`;

const StyledTypographyBox = styled(Typography)`
    margin-bottom: 200px;
`;
