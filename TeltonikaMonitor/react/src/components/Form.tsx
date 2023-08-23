import React, { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import styled from '@mui/material/styles/styled';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import useMediaQuery from '@mui/material/useMediaQuery';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import Button, { ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';

import { InfoSnackbar } from './Snackbar';
import { useSnackbar } from '../hooks/Snackbar';
import { PasswordInput } from './PasswordInput';
import { FormInput } from '../types';
import { CollapsibleFormSection } from './CollapsibleFormSection';

const nameOfThisPackage = 'teltonika_monitor';

type Props = {
    initialized: boolean;
    setInitialized: React.Dispatch<React.SetStateAction<boolean>>;
};

const defaultValues: FormInput = {
    modem: {
        token: '',
        device: '',
        refresh_period: 60,
    },
    co_camera: {
        protocol: 'http',
        ip: '127.0.0.1',
        port: 80,
        user: 'root',
        password: '',
    },
    map_camera: {
        protocol: 'http',
        ip: '127.0.0.1',
        port: 80,
        user: 'root',
        password: '',
    },
    overlay: {
        x: 10,
        y: 10,
        alignment: 'top_left',
        width: 1920,
        height: 1080,
        scale: 100,
    },
    map: {
        x: 10,
        y: 10,
        alignment: 'top_right',
        width: 1920,
        height: 1080,

        map_width: 100,
        map_height: 100,
        zoomLevel: 15,
        APIkey: '',
        tolerance: 2,
    },
};
function convert(input: FormInput) {
    if (typeof input.modem.refresh_period == 'string') {
        input.modem.refresh_period = parseInt(input.modem.refresh_period);
    }
    if (typeof input.co_camera.port == 'string') {
        input.co_camera.port = parseInt(input.co_camera.port);
    }
    if (typeof input.map_camera.port == 'string') {
        input.map_camera.port = parseInt(input.map_camera.port);
    }

    if (typeof input.overlay.x == 'string') {
        input.overlay.x = parseInt(input.overlay.x);
    }
    if (typeof input.overlay.y == 'string') {
        input.overlay.y = parseInt(input.overlay.y);
    }
    if (typeof input.overlay.width == 'string') {
        input.overlay.width = parseInt(input.overlay.width);
    }
    if (typeof input.overlay.height == 'string') {
        input.overlay.height = parseInt(input.overlay.height);
    }

    if (typeof input.map.x == 'string') {
        input.map.x = parseInt(input.map.x);
    }
    if (typeof input.map.y == 'string') {
        input.map.y = parseInt(input.map.y);
    }
    if (typeof input.map.width == 'string') {
        input.map.width = parseInt(input.map.width);
    }
    if (typeof input.map.height == 'string') {
        input.map.height = parseInt(input.map.height);
    }
    if (typeof input.map.map_width == 'string') {
        input.map.map_width = parseInt(input.map.map_width);
    }
    if (typeof input.map.map_height == 'string') {
        input.map.map_height = parseInt(input.map.map_height);
    }
    if (typeof input.map.zoomLevel == 'string') {
        input.map.zoomLevel = parseInt(input.map.zoomLevel);
    }
    if (typeof input.map.tolerance == 'string') {
        input.map.tolerance = parseInt(input.map.tolerance);
    }
}

export function Form({ initialized, setInitialized }: Props) {
    const [submitting, setSubmitting] = useState(false);

    const { snackbarData, displaySnackbar, closeSnackbar } = useSnackbar();
    const matchesSmallScreen = useMediaQuery('(max-width:390px)');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        control,
        setValue,
    } = useForm<FormInput>({ mode: 'onChange', defaultValues });

    const onSubmit: SubmitHandler<FormInput> = async (toPost) => {
        setSubmitting(true);
        convert(toPost);
        try {
            if (toPost.overlay.scale != null) {
                toPost.overlay.scale /= 100;
            }

            const res = await fetch(
                `/local/camscripter/package/settings.cgi?package_name=${nameOfThisPackage}&action=set`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(toPost),
                }
            );
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

    useEffect(() => {
        let skip = false;
        (async () => {
            setInitialized(false);
            let response: Response;
            let input: FormInput;
            try {
                response = await fetch(
                    `/local/camscripter/package/settings.cgi?package_name=${nameOfThisPackage}&action=get`
                );
                input = await response.json();
                input.overlay.scale! *= 100;

                if (skip) return;

                reset(input);
            } catch (error) {
                if (skip) return;

                console.error('Error while fetching default values: ', error);
                displaySnackbar({
                    type: 'error',
                    message: 'Error fetching default data.',
                });
            } finally {
                setInitialized(true);
            }
        })();

        return () => {
            skip = true;
        };
    }, [reset, setInitialized]);

    if (!initialized) {
        return (
            <Grid container justifyContent="center" alignItems="center">
                <CircularProgress size={70} />
            </Grid>
        );
    }

    return (
        <Fade in={initialized} timeout={1000}>
            <StyledForm onSubmit={handleSubmit(onSubmit)}>
                <InfoSnackbar snackbarData={snackbarData} closeSnackbar={closeSnackbar} />

                <StyledFormContent>
                    <Grid container spacing={2} direction={'column'}>
                        <CollapsibleFormSection label={'Teltonika modem settings'} defaultExpanded={true}>
                            <Grid item container spacing={2}>
                                <Grid item container xs={12} md={6} rowSpacing={2} direction="column">
                                    <Grid item>
                                        <Input
                                            required
                                            fullWidth
                                            label="Device ID"
                                            error={errors?.modem?.device != undefined}
                                            helperText={errors?.modem?.device?.message}
                                            {...register('modem.device', {
                                                required: { value: true, message: 'Modem device ID is required' },
                                                pattern: {
                                                    value: /^[0-9]*$/,
                                                    message: 'Set number',
                                                },
                                            })}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Input
                                            required
                                            fullWidth
                                            label="Access token"
                                            error={errors?.modem?.token != undefined}
                                            helperText={errors?.modem?.token?.message}
                                            {...register('modem.token', {
                                                required: { value: true, message: 'Access token for RMS is required' },
                                            })}
                                        />
                                    </Grid>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Input
                                        required
                                        fullWidth
                                        label="Refresh period"
                                        error={errors?.modem?.refresh_period != undefined}
                                        helperText={errors?.modem?.refresh_period?.message}
                                        {...register('modem.refresh_period', {
                                            required: { value: true, message: 'Refresh period is required' },
                                            pattern: {
                                                value: /^[0-9]*$/,
                                                message: 'Set number',
                                            },
                                        })}
                                    />
                                </Grid>
                            </Grid>
                        </CollapsibleFormSection>

                        <CollapsibleFormSection label={'CamOverlay Integration'} defaultExpanded={false}>
                            <Grid item container spacing={2}>
                                <Grid item container xs={12} md={6} rowSpacing={2} direction="column">
                                    <Grid item>
                                        <h3>Camera Settings</h3>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth>
                                            <InputLabel id="co_protocol">Protocol</InputLabel>
                                            <Controller
                                                render={({ field: { onBlur, ref, onChange } }) => (
                                                    <StyledSelect
                                                        labelId="co_protocol"
                                                        label="Protocol"
                                                        defaultValue={'http'}
                                                        onBlur={onBlur}
                                                        ref={ref}
                                                        onChange={(e) => {
                                                            const protocol = e.target.value;
                                                            setValue('co_camera.port', protocol === 'http' ? 80 : 443, {
                                                                shouldTouch: true,
                                                            });
                                                            onChange(e);
                                                        }}
                                                    >
                                                        <MenuItem value="http">HTTP</MenuItem>
                                                        <MenuItem value="https">HTTPS</MenuItem>
                                                        <MenuItem value="https_insecure">HTTPS (insecure)</MenuItem>
                                                    </StyledSelect>
                                                )}
                                                control={control}
                                                name="co_camera.protocol"
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <Input
                                            fullWidth
                                            label="IP"
                                            error={errors?.co_camera?.ip != undefined}
                                            helperText={errors?.co_camera?.ip?.message}
                                            {...register('co_camera.ip', {
                                                pattern: {
                                                    value: /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/,
                                                    message: 'Set valid IP adress (xxx.xxx.xxx.xxx)',
                                                },
                                            })}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Input
                                            fullWidth
                                            label="Port"
                                            error={errors?.co_camera?.port != undefined}
                                            helperText={errors?.co_camera?.port?.message}
                                            {...register('co_camera.port', {
                                                pattern: {
                                                    value: /^[0-9]*$/,
                                                    message: 'Port has to be a positive number less then 65536.',
                                                },
                                                min: {
                                                    value: 1,
                                                    message: 'Port has to be a positive number less then 65536.',
                                                },
                                                max: {
                                                    value: 65535,
                                                    message: 'Port has to be a positive number less then 65536.',
                                                },
                                            })}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Input fullWidth label="User" {...register('co_camera.user')} />
                                    </Grid>
                                    <Grid item>
                                        <PasswordInput register={register} name="co_camera.password" />
                                    </Grid>
                                </Grid>
                                <Grid item container xs={12} md={6} rowSpacing={2} direction="column">
                                    <Grid item>
                                        <h3>CamOverlay Settings</h3>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth>
                                            <InputLabel id="alignment">Positon</InputLabel>
                                            <Controller
                                                render={({ field }) => (
                                                    <StyledSelect
                                                        labelId="alignment"
                                                        label="Positon"
                                                        defaultValue="top_right"
                                                        {...field}
                                                    >
                                                        <MenuItem value="top_left">Top Left</MenuItem>
                                                        <MenuItem value="top_center">Top Center</MenuItem>
                                                        <MenuItem value="top_right">Top Right</MenuItem>
                                                        <MenuItem value="center_left">Left Center</MenuItem>
                                                        <MenuItem value="center">Center</MenuItem>
                                                        <MenuItem value="center_right">Right Center</MenuItem>
                                                        <MenuItem value="bottom_left">Left Bottom</MenuItem>
                                                        <MenuItem value="bottom_center">Center Bottom</MenuItem>
                                                        <MenuItem value="bottom_right">Right Bottom</MenuItem>
                                                    </StyledSelect>
                                                )}
                                                control={control}
                                                name="overlay.alignment"
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth error={errors?.overlay?.x != undefined}>
                                            <InputLabel>Offset x</InputLabel>
                                            <StyledOutlinedInput
                                                label="Offset x"
                                                endAdornment={<InputAdornment position="end">px</InputAdornment>}
                                                {...register('overlay.x', {
                                                    pattern: {
                                                        value: /^-?[0-9]*$/,
                                                        message: 'Set a number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.overlay?.x?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth error={errors?.overlay?.y != undefined}>
                                            <InputLabel>Offset y</InputLabel>
                                            <StyledOutlinedInput
                                                label="Offset y"
                                                endAdornment={<InputAdornment position="end">px</InputAdornment>}
                                                {...register('overlay.y', {
                                                    pattern: {
                                                        value: /^-?[0-9]*$/,
                                                        message: 'Set a number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.overlay?.y?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth error={errors?.overlay?.scale != undefined}>
                                            <InputLabel>Scale</InputLabel>
                                            <StyledOutlinedInput
                                                label="Scale"
                                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                                {...register('overlay.scale', {
                                                    pattern: {
                                                        value: /^[0-9]*$/,
                                                        message: 'Set a non-negative number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.overlay?.scale?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth error={errors?.overlay?.width != undefined}>
                                            <InputLabel>Stream Width</InputLabel>
                                            <StyledOutlinedInput
                                                label="Stream Width"
                                                endAdornment={<InputAdornment position="end">px</InputAdornment>}
                                                {...register('overlay.width', {
                                                    pattern: {
                                                        value: /^[0-9]*$/,
                                                        message: 'Set a non-negative number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.overlay?.width?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth error={errors?.overlay?.height != undefined}>
                                            <InputLabel>Stream Height</InputLabel>
                                            <StyledOutlinedInput
                                                label="Stream Height"
                                                endAdornment={<InputAdornment position="end">px</InputAdornment>}
                                                {...register('overlay.height', {
                                                    pattern: {
                                                        value: /^[0-9]*$/,
                                                        message: 'Set a non-negative number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.overlay?.height?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </CollapsibleFormSection>

                        <CollapsibleFormSection label={'Google maps integration'} defaultExpanded={false}>
                            <Grid item container spacing={2}>
                                <Grid item container xs={12} md={6} rowSpacing={2} direction="column">
                                    <Grid item>
                                        <h3>Camera Settings</h3>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth>
                                            <InputLabel id="events_protocol">Protocol</InputLabel>
                                            <Controller
                                                render={({ field: { onBlur, ref, onChange } }) => (
                                                    <StyledSelect
                                                        labelId="events_protocol"
                                                        label="Protocol"
                                                        defaultValue={'http'}
                                                        onBlur={onBlur}
                                                        ref={ref}
                                                        onChange={(e) => {
                                                            const protocol = e.target.value;
                                                            setValue(
                                                                'map_camera.port',
                                                                protocol === 'http' ? 80 : 443,
                                                                {
                                                                    shouldTouch: true,
                                                                }
                                                            );
                                                            onChange(e);
                                                        }}
                                                    >
                                                        <MenuItem value="http">HTTP</MenuItem>
                                                        <MenuItem value="https">HTTPS</MenuItem>
                                                        <MenuItem value="https_insecure">HTTPS (insecure)</MenuItem>
                                                    </StyledSelect>
                                                )}
                                                control={control}
                                                name="map_camera.protocol"
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <Input
                                            fullWidth
                                            label="IP"
                                            error={errors?.map_camera?.ip != undefined}
                                            helperText={errors?.map_camera?.ip?.message}
                                            {...register('map_camera.ip', {
                                                pattern: {
                                                    value: /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/,
                                                    message: 'Set valid IP adress (xxx.xxx.xxx.xxx)',
                                                },
                                            })}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Input
                                            fullWidth
                                            label="Port"
                                            error={errors?.map_camera?.port != undefined}
                                            helperText={errors?.map_camera?.port?.message}
                                            {...register('map_camera.port', {
                                                pattern: {
                                                    value: /^[0-9]*$/,
                                                    message: 'Port has to be a positive number less then 65536.',
                                                },
                                                min: {
                                                    value: 1,
                                                    message: 'Port has to be a positive number less then 65536.',
                                                },
                                                max: {
                                                    value: 65535,
                                                    message: 'Port has to be a positive number less then 65536.',
                                                },
                                            })}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Input fullWidth label="User" {...register('map_camera.user')} />
                                    </Grid>
                                    <Grid item>
                                        <PasswordInput register={register} name="map_camera.password" />
                                    </Grid>
                                </Grid>
                                <Grid item container xs={12} md={6} rowSpacing={2} direction="column">
                                    <Grid item>
                                        <h3>CamOverlay Settings</h3>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth>
                                            <InputLabel id="alignment">Positon</InputLabel>
                                            <Controller
                                                render={({ field }) => (
                                                    <StyledSelect
                                                        labelId="alignment"
                                                        label="Positon"
                                                        defaultValue="top_right"
                                                        {...field}
                                                    >
                                                        <MenuItem value="top_left">Top Left</MenuItem>
                                                        <MenuItem value="top_center">Top Center</MenuItem>
                                                        <MenuItem value="top_right">Top Right</MenuItem>
                                                        <MenuItem value="center_left">Left Center</MenuItem>
                                                        <MenuItem value="center">Center</MenuItem>
                                                        <MenuItem value="center_right">Right Center</MenuItem>
                                                        <MenuItem value="bottom_left">Left Bottom</MenuItem>
                                                        <MenuItem value="bottom_center">Center Bottom</MenuItem>
                                                        <MenuItem value="bottom_right">Right Bottom</MenuItem>
                                                    </StyledSelect>
                                                )}
                                                control={control}
                                                name="map.alignment"
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth error={errors?.map?.x != undefined}>
                                            <InputLabel>Offset x</InputLabel>
                                            <StyledOutlinedInput
                                                label="Offset x"
                                                endAdornment={<InputAdornment position="end">px</InputAdornment>}
                                                {...register('map.x', {
                                                    pattern: {
                                                        value: /^-?[0-9]*$/,
                                                        message: 'Set a number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.map?.x?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth error={errors?.map?.y != undefined}>
                                            <InputLabel>Offset y</InputLabel>
                                            <StyledOutlinedInput
                                                label="Offset y"
                                                endAdornment={<InputAdornment position="end">px</InputAdornment>}
                                                {...register('map.y', {
                                                    pattern: {
                                                        value: /^-?[0-9]*$/,
                                                        message: 'Set a number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.map?.y?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>

                                    <Grid item>
                                        <FormControl fullWidth error={errors?.map?.width != undefined}>
                                            <InputLabel>Stream Width</InputLabel>
                                            <StyledOutlinedInput
                                                label="Stream Width"
                                                endAdornment={<InputAdornment position="end">px</InputAdornment>}
                                                {...register('map.width', {
                                                    pattern: {
                                                        value: /^[0-9]*$/,
                                                        message: 'Set a non-negative number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.map?.width?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth error={errors?.map?.height != undefined}>
                                            <InputLabel>Stream Height</InputLabel>
                                            <StyledOutlinedInput
                                                label="Stream Height"
                                                endAdornment={<InputAdornment position="end">px</InputAdornment>}
                                                {...register('map.height', {
                                                    pattern: {
                                                        value: /^[0-9]*$/,
                                                        message: 'Set a non-negative number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.map?.height?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                                <Grid item container xs={12} md={6} rowSpacing={2} direction="column">
                                    <Grid item>
                                        <h3>Map Settings</h3>
                                    </Grid>

                                    <Grid item>
                                        <Input
                                            fullWidth
                                            label="Google API key"
                                            error={errors?.map?.APIkey != undefined}
                                            helperText={errors?.map?.APIkey?.message}
                                            {...register('map.APIkey')}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth error={errors?.map?.map_width != undefined}>
                                            <InputLabel>Map width</InputLabel>
                                            <StyledOutlinedInput
                                                label="Map width"
                                                endAdornment={<InputAdornment position="end">px</InputAdornment>}
                                                {...register('map.map_width', {
                                                    pattern: {
                                                        value: /^-?[0-9]*$/,
                                                        message: 'Set a number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.map?.map_width?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth error={errors?.map?.map_height != undefined}>
                                            <InputLabel>Map height</InputLabel>
                                            <StyledOutlinedInput
                                                label="Map height"
                                                endAdornment={<InputAdornment position="end">px</InputAdornment>}
                                                {...register('map.map_height', {
                                                    pattern: {
                                                        value: /^-?[0-9]*$/,
                                                        message: 'Set a number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.map?.map_height?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth error={errors?.map?.zoomLevel != undefined}>
                                            <InputLabel>Zoom level</InputLabel>
                                            <StyledOutlinedInput
                                                label="Map height"
                                                {...register('map.zoomLevel', {
                                                    pattern: {
                                                        value: /^-?[0-9]*$/,
                                                        message: 'Set a number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText>{errors?.map?.zoomLevel?.message}</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <FormControl fullWidth>
                                            <InputLabel error={errors?.map?.tolerance != undefined}>
                                                Precision
                                            </InputLabel>
                                            <StyledOutlinedInput
                                                error={errors?.map?.tolerance != undefined}
                                                endAdornment={<InputAdornment position="end">metres</InputAdornment>}
                                                label="Precision"
                                                {...register('map.tolerance', {
                                                    pattern: {
                                                        value: /^-?[0-9]*$/,
                                                        message: 'Set a number.',
                                                    },
                                                })}
                                            />
                                            <FormHelperText error={errors?.map?.tolerance != undefined}>
                                                {errors?.map?.tolerance?.message}
                                            </FormHelperText>
                                            <FormHelperText>
                                                This option can influence how often the map will be downloaded.
                                            </FormHelperText>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </CollapsibleFormSection>

                        <Grid item>
                            <SubmitButton
                                type="submit"
                                variant="contained"
                                disabled={Object.keys(errors).length > 0 || submitting}
                                isSmallScreen={matchesSmallScreen}
                            >
                                {submitting ? <CircularProgress size={20} /> : <Typography>Submit</Typography>}
                            </SubmitButton>
                        </Grid>
                    </Grid>
                </StyledFormContent>
            </StyledForm>
        </Fade>
    );
}

const Input = styled(TextField)({
    backgroundColor: 'white',
});
const StyledSelect = styled(Select)({
    backgroundColor: 'white',
});
const StyledOutlinedInput = styled(OutlinedInput)({
    backgroundColor: 'white',
});
const StyledForm = styled('form')({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
});
const StyledFormContent = styled(Stack)({
    width: 'max(300px, 90%)',
});
const SubmitButton = styled((props: { isSmallScreen: boolean } & ButtonProps) => {
    const { ...other } = props;
    return <Button {...other} />;
})(({ isSmallScreen }) => ({
    width: isSmallScreen ? '100%' : '33%',
    height: '40px',
}));
