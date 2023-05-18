import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Typography, useMediaQuery } from '@mui/material';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { InfoSnackbar } from './InfoSnackbar';
import TextField from '@mui/material/TextField';
import { useSnackbar } from './useSnackbar';

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

export const Form = () => {
    const [fetchingDefaultValues, setFetchingDefaultValues] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { snackbarData, displaySnackbar, closeSnackbar } = useSnackbar();

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
            setFetchingDefaultValues(true);
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
                setFetchingDefaultValues(false);
            }
        })();

        return () => {
            skip = true;
        };
    }, [reset, displaySnackbar]);

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

    if (fetchingDefaultValues) {
        return (
            <Grid container justifyContent="center" alignItems="center" height="50%">
                <CircularProgress size={100} />
            </Grid>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} style={style.form}>
            <InfoSnackbar
                isSmallScreen={matchesSmallScreen}
                snackbarData={snackbarData}
                closeSnackbar={closeSnackbar}
            />
            <Grid container rowSpacing={2} direction="column" style={style.formContent}>
                <Grid item>
                    <TextField
                        type="number"
                        label="Station ID"
                        fullWidth
                        error={!!errors.stationId}
                        helperText={errors.stationId && 'Station ID is required'}
                        {...register('stationId', { required: true })}
                    />
                </Grid>
                <Grid item>
                    <TextField type="text" label="Location name" fullWidth {...register('locationName')} />
                </Grid>
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
                    <TextField type="text" label="Camera password" fullWidth {...register('cameraPass')} />
                </Grid>
                <Grid item>
                    <TextField
                        type="number"
                        label="Custom graphics service ID"
                        fullWidth
                        {...register('cgServiceId')}
                    />
                </Grid>
                <Grid item>
                    <TextField type="text" label="Custom graphics field name" fullWidth {...register('cgFieldName')} />
                </Grid>
                <Grid item>
                    <TextField type="number" label="Infoticker service ID" fullWidth {...register('itServiceId')} />
                </Grid>
                <Grid item>
                    <TextField
                        type="number"
                        label="Data refresh rate (seconds)"
                        fullWidth
                        error={!!errors.dataRefreshRateS}
                        helperText={errors.dataRefreshRateS && 'The minimum rate is 60 seconds'}
                        {...register('dataRefreshRateS', { min: 60 })}
                    />
                </Grid>
                <Grid item>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={Object.keys(errors).length > 0 || submitting}
                        style={matchesSmallScreen ? style.buttonSmallScreen : style.button}
                    >
                        {submitting ? <CircularProgress size={20} /> : <Typography>Submit</Typography>}
                    </Button>
                </Grid>
            </Grid>
        </form>
    );
};

const style: TStyleSheet = {
    formContent: {
        paddingBottom: '16px',
        width: 'clamp(350px, 50%, 1000px)',
    },
    form: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
    },
    button: {
        width: '33%',
        height: '40px',
    },
    buttonSmallScreen: {
        width: '100%',
        height: '40px',
    },
};
