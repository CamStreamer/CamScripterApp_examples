import { Alert, Slide, SlideProps, Snackbar, SnackbarOrigin, Typography, useMediaQuery } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

type Props = {};
type FormData = {
    stationId: number;
    locationName: string;
    cameraIp: string;
    cameraPort: number;
    cameraUser: string;
    cameraPass: string;
    cgServiceId: number | null;
    cgFieldName: string | null;
    itServiceId: number | null;
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
    cgFieldName: '',
    itServiceId: 0,
    dataRefreshRateS: 120,
};

type TSnackData = {
    type: 'error' | 'success';
    message: string;
};

const TRANSITION_PROPS_LARGE: SnackbarOrigin = { vertical: 'bottom', horizontal: 'right' };
const TRANSITION_PROPS_SMALL: SnackbarOrigin = { vertical: 'top', horizontal: 'center' };

const SNACK_TIMEOUT = 5000;

export const Form = (props: Props) => {
    const [fetchingDefaultValues, setFetchingDefaultValues] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [snackData, setSnackData] = useState<null | TSnackData>(null);

    const errorMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const matchesSmallScreen = useMediaQuery('(max-width:390px)');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: {
            stationId: 0,
            locationName: '',
            cameraIp: '',
            cameraPort: 80,
            cameraUser: '',
            cameraPass: '',
            cgServiceId: 0,
            cgFieldName: '',
            itServiceId: 0,
            dataRefreshRateS: 120,
        },
    });

    useEffect(() => {
        (async () => {
            setFetchingDefaultValues(true);
            let response: Response;
            let data: TServerData;
            try {
                response = await fetch('/local/camscripter/package/settings.cgi?package_name=noaa&action=get');
                data = await response.json();
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
                console.error('Error while fetching default values: ', e);
                setSnackData({
                    type: 'error',
                    message: 'Error fetching default data. Using backup data.',
                });
                reset(errorDefaultValues);
                if (errorMessageTimeoutRef.current) {
                    clearTimeout(errorMessageTimeoutRef.current);
                }
                errorMessageTimeoutRef.current = setTimeout(() => {
                    setSnackData(null);
                    errorMessageTimeoutRef.current = null;
                }, SNACK_TIMEOUT);
            } finally {
                setFetchingDefaultValues(false);
            }
        })();
    }, [reset]);

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

            setSnackData({
                type: 'success',
                message: 'Settings successfully saved.',
            });
            if (errorMessageTimeoutRef.current) {
                clearTimeout(errorMessageTimeoutRef.current);
            }
            errorMessageTimeoutRef.current = setTimeout(() => {
                setSnackData(null);
                errorMessageTimeoutRef.current = null;
            }, SNACK_TIMEOUT);
        } catch (e) {
            console.error('Error while submitting data: ', e);
            setSnackData({
                type: 'error',
                message: 'Error submitting data.',
            });
            if (errorMessageTimeoutRef.current) {
                clearTimeout(errorMessageTimeoutRef.current);
            }
            errorMessageTimeoutRef.current = setTimeout(() => {
                setSnackData(null);
                errorMessageTimeoutRef.current = null;
            }, SNACK_TIMEOUT);
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
            <Snackbar
                open={!!snackData}
                anchorOrigin={matchesSmallScreen ? TRANSITION_PROPS_SMALL : TRANSITION_PROPS_LARGE}
                TransitionComponent={(props: SlideProps) => (
                    <Slide {...props} direction={matchesSmallScreen ? 'down' : 'up'} />
                )}
            >
                <Alert
                    severity={snackData?.type}
                    variant="filled"
                    onClose={() => {
                        setSnackData(null);
                    }}
                >
                    {snackData && snackData.message}
                </Alert>
            </Snackbar>
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
