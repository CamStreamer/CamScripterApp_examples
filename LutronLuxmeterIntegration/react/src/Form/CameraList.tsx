import { useState, useEffect, useRef } from 'react';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import styled from '@mui/material/styles/styled';
import Typography from '@mui/material/Typography';
import { useFieldArray, UseFieldArrayRemove, useFormContext } from 'react-hook-form';
import { TSettings } from '../models/schema';
import { CameraConnectParams } from './CameraConnectParams';
import { useCameraList } from '../hooks/useCameraList';
import { useInitializeOnMount } from '../hooks/useInitializeOnMount';

import ErrorIcon from '@mui/icons-material/ErrorOutline';
import MenuIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import Backdrop from '@mui/material/Backdrop';

export const CameraList = () => {
    const loading = useRef(true);
    const { control } = useFormContext<TSettings>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'cameras',
    });

    useEffect(() => {
        loading.current = false;
    }, []);

    return (
        <>
            <Grid container direction="column" rowGap={2}>
                <Grid item container direction="row" spacing={2}>
                    {fields.map((item, index, items) => (
                        <CameraField
                            key={item.id}
                            index={index}
                            remove={remove}
                            appending={index === items.length - 1 && !loading.current}
                        />
                    ))}
                </Grid>
                <Grid item>
                    <Button
                        variant="contained"
                        onClick={() => {
                            append({ protocol: 'http', ip: '', port: 80, user: 'root', pass: '', cameraList: [0] });
                        }}
                    >
                        <Typography>Add new camera</Typography>
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};

type FieldProps = {
    index: number;
    remove: UseFieldArrayRemove;
    appending: boolean;
};
const CameraField = ({ index, remove, appending }: FieldProps) => {
    const [areCredentialsValid, setAreCredentialsValid] = useState(true);
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);
    const [backdropOpen, setBackdropOpen] = useState(appending);

    return (
        <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ p: 2 }}>
                <Grid container direction="row" alignItems="center">
                    <Grid item xs={5}>
                        <Typography fontSize="120%">Camera {index + 1}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        {!areCredentialsValid && (
                            <Stack direction="row">
                                <ErrorIcon color="error" />
                                <RedTypography>Wrong credentials</RedTypography>
                            </Stack>
                        )}
                    </Grid>
                    <Grid item xs={1}>
                        <RawButton onClick={(event) => setAnchor(event.currentTarget)}>
                            <MenuIcon />
                        </RawButton>
                    </Grid>
                </Grid>

                <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
                    <MenuItem
                        onClick={() => {
                            setBackdropOpen(true);
                            setAnchor(null);
                        }}
                    >
                        Edit
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            remove(index);
                            setAnchor(null);
                        }}
                    >
                        Remove
                    </MenuItem>
                </Menu>
                <CameraBackdrop
                    appending={appending}
                    index={index}
                    remove={remove}
                    open={backdropOpen}
                    setOpen={setBackdropOpen}
                    validCredentials={areCredentialsValid}
                    setValidCredentials={setAreCredentialsValid}
                />
            </Card>
        </Grid>
    );
};

type BackdropProps = {
    index: number;
    open: boolean;
    remove: UseFieldArrayRemove;
    appending: boolean;
    setOpen: (open: boolean) => void;
    validCredentials: boolean;
    setValidCredentials: (open: boolean) => void;
};
const CameraBackdrop = ({ index, open, setOpen, validCredentials, setValidCredentials }: BackdropProps) => {
    const { getValues, setValue } = useFormContext<TSettings>();
    const [lastValues, setLastValues] = useState(getValues(`cameras.${index}`));
    const [viewAreaList, fetchCameraList] = useCameraList(index);
    useInitializeOnMount(fetchCameraList);

    return (
        <Backdrop open={open} sx={{ color: '#f5f5f5', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <CameraSettingsCard>
                <Typography>
                    <h2>Add camera</h2>
                </Typography>
                <CameraConnectParams
                    index={index}
                    viewAreaList={viewAreaList}
                    areCredentialsValid={validCredentials}
                    setAreCredentialsValid={setValidCredentials}
                    onChange={fetchCameraList}
                />
                <Grid container flexDirection="row-reverse" spacing={2}>
                    <StyledGrid item>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setOpen(false);
                                setLastValues(getValues(`cameras.${index}`));
                            }}
                        >
                            CLOSE
                        </Button>
                    </StyledGrid>
                    <StyledGrid item>
                        <Button
                            onClick={() => {
                                setOpen(false);
                                setValue(`cameras.${index}`, lastValues);
                            }}
                        >
                            CANCEL
                        </Button>
                    </StyledGrid>
                </Grid>
            </CameraSettingsCard>
        </Backdrop>
    );
};
const StyledGrid = styled(Grid)({
    marginTop: 15,
    marginBottom: 15,
});
const CameraSettingsCard = styled(Card)({ paddingLeft: 30, paddingRight: 30 });

const RedTypography = styled(Typography)({ color: '#d32f2f', fontWeight: '80%', marginLeft: '5px' });
const RawButton = styled(IconButton)({ padding: 0 });
