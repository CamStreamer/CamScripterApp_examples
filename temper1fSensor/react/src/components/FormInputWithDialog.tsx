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
                <List>
                    {cameraOptions.map((option) => (
                        <StyledBox key={option.ip}>
                            <StyledListItem disableGutters key={option.ip}>
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
                    ))}
                </List>
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
                            <Button variant="text" color="info" onClick={handleClickOpen}>
                                <strong>FIND CAMERA</strong>
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

    @media (max-width: 600px) {
    }
`;

const StyledListDiv = styled('div')`
    display: flex;
    align-items: center;

    @media (max-width: 600px) {
        padding-right: 20px;
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
`;

const StyledButton = styled(Button)`
    margin-right: 30px;
`;

const DEFAULT_CAMERA_LIST: TCameraOption[] = [
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '192.168.91.213' },
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '192.168.91.214' },
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '192.168.91.215' },
    { name: 'AXIS A8105-E - ACC8EFF250F', ip: '192.168.91.216' },
    { name: 'AXIS A8105-E - ACCC8EFF250F', ip: '192.168.91.213' },
    { name: 'AXIS A8105-E - B8A44F2DA128', ip: '192.168.91.205' },
    { name: 'AXIS C8110 - B8A44F7669AB', ip: '192.168.91.160' },
    { name: 'AXIS D3110 - B8A44F66BB34', ip: '192.168.91.120' },
    { name: 'AXIS M1054 - 00408CAC35B0', ip: '192.168.91.14' },
    { name: 'AXIS M1054 - 00408CAFA8F9', ip: '192.168.91.97' },
    { name: 'AXIS M1054 - 00408CC2505D', ip: '192.168.91.10' },
    { name: 'AXIS M1054 - 00408CD82AE5', ip: '192.168.91.87' },
    { name: 'AXIS M1065-L - ACCC8EDE026D @ hanicinect', ip: '192.168.91.154' },
    { name: 'AXIS M1075-L - B8A44FB4F363 @ subtest', ip: '192.168.91.133' },
    { name: 'AXIS M1135 - B8A44F03B510 @ neotest', ip: '192.168.91.18' },
    { name: 'AXIS M1135 - B8A44F092128 @ system2', ip: '192.168.91.128' },
    { name: 'AXIS M1135 - B8A44F14F393 @ mustafina', ip: '192.168.91.207' },
    { name: 'AXIS M1137 Mk II - B8A44F31208E @ novotnyv', ip: '192.168.91.124' },
    { name: 'AXIS M1137 Mk II - B8A44F5E63D6 @ mustafina', ip: '192.168.91.94' },
    { name: 'AXIS M1137 Mk II - B8A44F5E7F51 @ pejchaj', ip: '192.168.91.226' },
    { name: 'AXIS M1137 Mk II - B8A44F6CE448 @ hanicinect', ip: '192.168.91.132' },
    { name: 'AXIS M1137 Mk II - B8A44F8B3FA4', ip: '192.168.91.169' },
    { name: 'AXIS M3004 - ACCC8E0EF995', ip: '192.168.91.86' },
    { name: 'AXIS M3006 - 00408CFDFA00 @ neotest', ip: '192.168.91.140' },
    { name: 'AXIS M3006 - ACCC8E019F97 @ jp', ip: '192.168.91.85' },
    { name: 'AXIS M3044-V - ACCC8EC3FDE8 @ retest', ip: '192.168.91.144' },
    { name: 'AXIS M3047-P - ACCC8EDC097A @ subtest', ip: '192.168.91.166' },
    { name: 'AXIS M3064-V - B8A44F4A4474 @ tichavskyj', ip: '192.168.91.170' },
    { name: 'AXIS M3064-V - B8A44F4AD80A @ neotest', ip: '192.168.91.153' },
    { name: 'AXIS M3064-V - B8A44F4ADDCF @ peritest', ip: '192.168.91.148' },
    { name: 'AXIS M3064-V - B8A44F4AE0A1 @ jp', ip: '192.168.91.208' },
    { name: 'AXIS M3064-V - B8A44F526652 @ pejchaj', ip: '192.168.91.126' },
    { name: 'AXIS M3064-V - B8A44F526908 @ subtest', ip: '192.168.91.118' },
    { name: 'AXIS M3065-V - B8A44F435E17 @ retest', ip: '192.168.91.122' },
    { name: 'AXIS M3065-V - B8A44F4A5E0F @ hanicinect', ip: '192.168.91.102' },
    { name: 'AXIS M3077-PLVE - B8A44F0AD252', ip: '192.168.91.240' },
    { name: 'AXIS M3085-V - B8A44F46A95E @ kurisj', ip: '192.168.91.146' },
    { name: 'AXIS M3085-V - B8A44F542169 @ miksikr', ip: '192.168.91.163' },
    { name: 'AXIS M3085-V - B8A44F5F3E0D @ jp', ip: '192.168.91.127' },
    { name: 'AXIS M3085-V - B8A44F5F60B9 @ miksikr', ip: '192.168.91.200' },
    { name: 'AXIS M3085-V - B8A44F7B0E6E @ zimmermannj', ip: '192.168.91.90' },
    { name: 'AXIS M3085-V - B8A44FB5FC8A', ip: '192.168.91.100' },
    { name: 'AXIS M3106-L-MkII - ACCC8ED1538A @ system2', ip: '192.168.91.233' },
    { name: 'AXIS M3106-L-MkII - ACCC8EDDDEB4 @ system2', ip: '192.168.91.119' },
    { name: 'AXIS M3106-L-MkII - ACCC8EDDDECF @ system2', ip: '192.168.91.125' },
    { name: 'AXIS M3114 - 00408CC1E2D6', ip: '192.168.91.11' },
    { name: 'AXIS M3114 - 00408CC49D3B', ip: '192.168.91.93' },
    { name: 'AXIS M3115-LVE - B8A44F430825 @ miksikr', ip: '192.168.91.210' },
    { name: 'AXIS M3116-LVE - B8A44F60B671 @ tichavskyj', ip: '192.168.91.149' },
    { name: 'AXIS M3116-LVE - E8272506C1EA @ pejchaj', ip: '192.168.90.179' },
    { name: 'AXIS P1357 - ACCC8E2E07F2 @ system2', ip: '192.168.91.105' },
    { name: 'AXIS P1365 - ACCC8E2972E7 @ system2', ip: '192.168.91.101' },
    { name: 'AXIS P1365 Mk II - ACCC8E29ABD7 @ kurisj', ip: '192.168.91.36' },
    { name: 'AXIS P1365 Mk II - ACCC8E6C79F9', ip: '192.168.91.209' },
    { name: 'AXIS P1388 - B8A44FB82C66 @ system2', ip: '192.168.91.150' },
    { name: 'AXIS P1448-LE - B8A44F4D0EA1 @ peritest', ip: '192.168.91.231' },
    { name: 'AXIS P1455-LE - B8A44F31988F', ip: '192.168.91.111' },
    { name: 'AXIS P1455-LE - B8A44F3BB0B4 @ pretest', ip: '192.168.91.19' },
    { name: 'AXIS P1455-LE - B8A44F490AE1', ip: '192.168.91.131' },
    { name: 'AXIS P1455-LE - B8A44F492563', ip: '192.168.91.222' },
    { name: 'AXIS P1455-LE - B8A44F591FF7 @ tichavskyj', ip: '192.168.91.143' },
    { name: 'AXIS P1465-LE - B8A44F6D349D @ system2', ip: '192.168.91.24' },
    { name: 'AXIS P1465-LE - B8A44F6EE6E3 @ peritest', ip: '192.168.91.138' },
    { name: 'AXIS P1468-LE - B8A44FB08AFC @ beranovah', ip: '192.168.91.91' },
    { name: 'AXIS P3228-LV - B8A44F140B8D @ system2', ip: '192.168.91.171' },
    { name: 'AXIS P3265-LVE - B8A44F73E891 @ neotest', ip: '192.168.91.115' },
    { name: 'AXIS P3265-V - B8A44F5E8B45 @ chuleim', ip: '192.168.91.220' },
    { name: 'AXIS P3343 - 00408CA65FFB', ip: '192.168.91.155' },
    { name: 'AXIS P3344 - 00408CA5D824', ip: '192.168.91.104' },
    { name: 'AXIS P3364 - 00408CFEDC3E', ip: '192.168.91.121' },
    { name: 'AXIS P3717-PLE - ACCC8EB41FA1 @ system2', ip: '192.168.91.176' },
    { name: 'AXIS People Counter - AXIS M3004 - ACCC8E1A5708', ip: '192.168.91.168' },
    { name: 'AXIS People Counter - AXIS M3004 - ACCC8E54038B', ip: '192.168.91.109' },
    { name: 'AXIS People Counter - AXIS M3085-V - B8A44F54232A @ jp', ip: '192.168.91.26' },
    { name: 'AXIS People Counter - AXIS M3113 - 00408CF1EC45', ip: '192.168.91.98' },
    { name: 'AXIS People Counter - AXIS M5014 - 00408CD5BAF3', ip: '192.168.91.114' },
    { name: 'AXIS Q1635 - ACCC8E4E493E @ subtest', ip: '192.168.91.25' },
    { name: 'AXIS Q3515 - ACCC8EBE118F @ simekd', ip: '192.168.91.142' },
    { name: 'AXIS Q3819-PVE - B8A44F4C3A1C', ip: '192.168.91.206' },
    { name: 'AXIS V5925 - B8A44F631BA0 @ neotest', ip: '192.168.91.211' },
];
