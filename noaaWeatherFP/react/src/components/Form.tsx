import Button, { ButtonProps } from '@mui/material/Button';
import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import CircularProgress from '@mui/material/CircularProgress';
import { CollapsibleFormSection } from './CollapsibleFormSection';
import Fade from '@mui/material/Fade';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import { InfoSnackbar } from './InfoSnackbar';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { styled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSnackbar } from '../hooks/useSnackbar';

// NOTE: empty string in serviceId means the service is not enabled
type FormData = {
    stationId: number;
    locationName: string;
    cameraIp: string;
    cameraPort: number;
    cameraUser: string;
    cameraPass: string;
    cgServiceId: number | '';
    cgFieldName: string;
    itServiceId: number | '';
    dataRefreshRateS: number;
};

const errorDefaultValues: FormData = {
    stationId: 8658163,
    locationName: 'Johnnie Mercers Fishing Pier',
    cameraIp: '127.0.0.1',
    cameraPort: 80,
    cameraUser: 'root',
    cameraPass: '',
    cgServiceId: '',
    cgFieldName: 'field1',
    itServiceId: '',
    dataRefreshRateS: 120,
};

type Props = {
    isFormInitialized: boolean;
    setIsFormInitialized: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Form = ({ isFormInitialized, setIsFormInitialized }: Props) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { snackbarData, displaySnackbar, closeSnackbar } = useSnackbar();
    const [showPassword, setShowPassword] = useState(false);

    const matchesSmallScreen = useMediaQuery('(max-width:390px)');

    const handleClickShowPassword = () => setShowPassword((show) => !show);

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
                response = await fetch('/local/camscripter/package/settings.cgi?package_name=noaaWeatherFP&action=get');
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
        setIsSubmitting(true);
        try {
            const res = await fetch('/local/camscripter/package/settings.cgi?package_name=noaaWeatherFP&action=set', {
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
            setIsSubmitting(false);
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
            <StyledForm onSubmit={handleSubmit(onSubmit)}>
                <InfoSnackbar snackbarData={snackbarData} closeSnackbar={closeSnackbar} />
                <StyledFormContent spacing={2}>
                    <Grid container rowSpacing={2} direction="column">
                        <StyledLabelText textTransform="uppercase">Api settings</StyledLabelText>
                        <Grid item>
                            <TextField
                                type="number"
                                label="Station ID"
                                required
                                fullWidth
                                error={!!errors.stationId}
                                helperText={errors?.stationId?.message}
                                {...register('stationId', {
                                    required: { value: true, message: 'Station ID is required' },
                                    minLength: { value: 7, message: 'Station ID has at least 7 digits' },
                                })}
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
                                    helperText={errors?.dataRefreshRateS?.message}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Typography>sec</Typography>
                                            </InputAdornment>
                                        ),
                                    }}
                                    {...register('dataRefreshRateS', {
                                        min: { value: 60, message: 'The minimum rate is 60 seconds' },
                                    })}
                                />
                            </Grid>
                        </Grid>
                    </CollapsibleFormSection>
                    <StyledSubmitButton
                        type="submit"
                        variant="contained"
                        disabled={Object.keys(errors).length > 0 || isSubmitting}
                        isSmallScreen={matchesSmallScreen}
                    >
                        {isSubmitting ? <CircularProgress size={20} /> : <Typography>Submit</Typography>}
                    </StyledSubmitButton>
                </StyledFormContent>
            </StyledForm>
        </Fade>
    );
};

const StyledLabelText = styled(Typography)({
    fontSize: '1em',
    opacity: 0.9,
});

const StyledForm = styled('form')({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
});

const StyledFormContent = styled(Stack)({
    width: 'max(300px, 90%)',
});

const StyledSubmitButton = styled((props: { isSmallScreen: boolean } & ButtonProps) => {
    const { isSmallScreen, ...other } = props;
    return <Button {...other} />;
})(({ isSmallScreen }) => ({
    width: isSmallScreen ? '100%' : '33%',
    height: '40px',
}));
