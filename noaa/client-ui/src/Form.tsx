import { useMediaQuery } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';

import Grid from '@mui/material/Grid';
import { InfoSnackbar } from './InfoSnackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useSnackbar } from './useSnackbar';
import { CollapsibleFormSection } from './CollapsibleFormSection';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import styles from './Form.module.css';

type FormData = {
    stationId: number;
    locationName: string;
    cameraIp: string;
    cameraPort: number;
    cameraUser: string;
    cameraPass: string;
    cgServiceId: number;
    cgFieldName: string;
    itServiceId: number;
    dataRefreshRateS: number;
};

const errorDefaultValues: FormData = {
    stationId: 8658163,
    locationName: 'Johnnie Mercers Fishing Pier',
    cameraIp: '127.0.0.1',
    cameraPort: 80,
    cameraUser: 'root',
    cameraPass: '',
    cgServiceId: 0,
    cgFieldName: 'field1',
    itServiceId: 0,
    dataRefreshRateS: 120,
};

type Props = {
    isFormInitialized: boolean;
    setIsFormInitialized: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Form = ({ isFormInitialized, setIsFormInitialized }: Props) => {
    const [submitting, setSubmitting] = useState(false);
    const { snackbarData, displaySnackbar, closeSnackbar } = useSnackbar();
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const matchesSmallScreen = useMediaQuery('(max-width:390px)');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: errorDefaultValues,
    });

    useEffect(() => {
        let skip = false;
        (async () => {
            setIsFormInitialized(false);
            let response: Response;
            let data: TServerData;
            try {
                response = await fetch('/local/camscripter/package/settings.cgi?package_name=noaa&action=get');
                data = await response.json();

                if (skip) return;

                reset({
                    stationId: data.station_id,
                    locationName: data.location_name,
                    cameraIp: data.camera_ip,
                    cameraPort: data.camera_port,
                    cameraUser: data.camera_user,
                    cameraPass: data.camera_pass,
                    cgServiceId: data.cg_service_id,
                    cgFieldName: data.cg_field_name,
                    itServiceId: data.it_service_id,
                    dataRefreshRateS: data.data_refresh_rate_s,
                });
            } catch (e) {
                if (skip) return;

                console.error('Error while fetching default values: ', e);
                displaySnackbar({
                    type: 'error',
                    message: 'Error fetching default data. Using backup data.',
                });
            } finally {
                setIsFormInitialized(true);
            }
        })();

        return () => {
            skip = true;
        };
    }, [reset, displaySnackbar, setIsFormInitialized]);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        const toPost: TServerData = {
            station_id: data.stationId,
            location_name: data.locationName,
            camera_ip: data.cameraIp,
            camera_port: data.cameraPort,
            camera_user: data.cameraUser,
            camera_pass: data.cameraPass,
            cg_service_id: data.cgServiceId,
            cg_field_name: data.cgFieldName,
            it_service_id: data.itServiceId,
            data_refresh_rate_s: data.dataRefreshRateS,
        };
        setSubmitting(true);
        try {
            const res = await fetch('/local/camscripter/package/settings.cgi?package_name=noaa&action=set', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(toPost),
            });
            if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);

            displaySnackbar({
                type: 'success',
                message: 'Settings successfully saved.',
            });
        } catch (e) {
            console.error('Error while submitting data: ', e);
            displaySnackbar({
                type: 'error',
                message: 'Error submitting data.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isFormInitialized) {
        return (
            <Grid container justifyContent="center" alignItems="center">
                <CircularProgress size={70} />
            </Grid>
        );
    }

    return (
        <Fade in={isFormInitialized} timeout={1000}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <InfoSnackbar
                    isSmallScreen={matchesSmallScreen}
                    snackbarData={snackbarData}
                    closeSnackbar={closeSnackbar}
                />
                <Stack spacing={2} className={styles.formContent}>
                    <Grid container rowSpacing={2} direction="column">
                        <Typography textTransform="uppercase" className="text">
                            Api settings
                        </Typography>
                        <Grid item>
                            <TextField
                                type="number"
                                label="Station ID"
                                required
                                fullWidth
                                error={!!errors.stationId}
                                helperText={
                                    errors.stationId &&
                                    (errors.stationId?.type === 'required'
                                        ? 'Station ID is required'
                                        : 'Station ID has at least 7 digits')
                                }
                                {...register('stationId', { required: true, minLength: 7 })}
                            />
                        </Grid>
                        <Grid item>
                            <TextField type="text" label="Location name" fullWidth {...register('locationName')} />
                        </Grid>
                    </Grid>
                    <CollapsibleFormSection label={'Camera settings'}>
                        <Grid container rowSpacing={2} direction="column">
                            <Grid item>
                                <TextField type="text" label="Camera IP" fullWidth {...register('cameraIp')} />
                            </Grid>
                            <Grid item>
                                <TextField type="number" label="Camera port" fullWidth {...register('cameraPort')} />
                            </Grid>
                            <Grid item>
                                <TextField type="text" label="Camera username" fullWidth {...register('cameraUser')} />
                            </Grid>
                            <Grid item>
                                <TextField
                                    type={showPassword ? 'text' : 'password'}
                                    label="Camera password"
                                    fullWidth
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={handleClickShowPassword}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    {...register('cameraPass')}
                                />
                            </Grid>
                        </Grid>
                    </CollapsibleFormSection>
                    <CollapsibleFormSection label={'Camoverlay integration'}>
                        <Grid container rowSpacing={2} direction="column">
                            <Grid item>
                                <TextField
                                    type="number"
                                    label="Custom graphics service ID"
                                    fullWidth
                                    {...register('cgServiceId')}
                                />
                            </Grid>
                            <Grid item>
                                <TextField
                                    type="text"
                                    label="Custom graphics field name"
                                    fullWidth
                                    {...register('cgFieldName')}
                                />
                            </Grid>
                            <Grid item>
                                <TextField
                                    type="number"
                                    label="Infoticker service ID"
                                    fullWidth
                                    {...register('itServiceId')}
                                />
                            </Grid>
                            <Grid item>
                                <TextField
                                    type="number"
                                    label="Data refresh rate"
                                    fullWidth
                                    error={!!errors.dataRefreshRateS}
                                    helperText={errors.dataRefreshRateS && 'The minimum rate is 60 seconds'}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Typography>sec</Typography>
                                            </InputAdornment>
                                        ),
                                    }}
                                    {...register('dataRefreshRateS', { min: 60 })}
                                />
                            </Grid>
                        </Grid>
                    </CollapsibleFormSection>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={Object.keys(errors).length > 0 || submitting}
                        className={styles.button}
                    >
                        {submitting ? <CircularProgress size={20} /> : <Typography>Submit</Typography>}
                    </Button>
                </Stack>
            </form>
        </Fade>
    );
};
