import Button, { ButtonProps } from '@mui/material/Button';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { FormInput, convertValueToNumber, defaultValues } from '../FormInput';
import React, { useEffect } from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import { CollapsibleFormSection } from './CollapsibleFormSection';
import Fade from '@mui/material/Fade';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import { InfoSnackbar } from './Snackbar';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import { PasswordInput } from './PasswordInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import styled from '@mui/material/styles/styled';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSnackbar } from '../hooks/Snackbar';

const nameOfThisPackage = 'teltonika_monitor';

type Props = {
    initialized: boolean;
    setInitialized: React.Dispatch<React.SetStateAction<boolean>>;
};

export function Form({ initialized, setInitialized }: Props) {
    const { snackbarData, displaySnackbar, closeSnackbar } = useSnackbar();
    const matchesSmallScreen = useMediaQuery('(max-width:390px)');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
        setValue,
    } = useForm<FormInput>({ mode: 'onChange', defaultValues });

    const onSubmit: SubmitHandler<FormInput> = async (toPost) => {
        convertValueToNumber(toPost);
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
            <StyledForm onSubmit={handleSubmit(onSubmit, (e) => console.log(e))}>
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
                                    <FormControl error={errors?.modem?.refresh_period != undefined} fullWidth required>
                                        <InputLabel>Refresh period</InputLabel>
                                        <StyledOutlinedInput
                                            endAdornment={<InputAdornment position="end">seconds</InputAdornment>}
                                            label="Refresh period"
                                            {...register('modem.refresh_period', {
                                                required: { value: true, message: 'Refresh period is required' },
                                                pattern: {
                                                    value: /^[0-9]*$/,
                                                    message: 'Set number',
                                                },
                                            })}
                                        />
                                        <FormHelperText>{errors?.map?.tolerance?.message}</FormHelperText>
                                    </FormControl>
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
                                        <Controller
                                            name="co_camera.port"
                                            control={control}
                                            rules={{
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
                                            }}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    fullWidth
                                                    label="Port"
                                                    error={errors?.co_camera?.port != undefined}
                                                    helperText={errors?.co_camera?.port?.message}
                                                />
                                            )}
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
                                        <Controller
                                            name="map_camera.port"
                                            control={control}
                                            rules={{
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
                                            }}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    fullWidth
                                                    label="Port"
                                                    error={errors?.map_camera?.port != undefined}
                                                    helperText={errors?.map_camera?.port?.message}
                                                />
                                            )}
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

                        <CollapsibleFormSection label={'accuweather integration'} defaultExpanded={false}>
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
                                                                'accuweather_camera.port',
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
                                                name="accuweather_camera.protocol"
                                            />
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <Input
                                            fullWidth
                                            label="IP"
                                            error={errors?.accuweather_camera?.ip != undefined}
                                            helperText={errors?.accuweather_camera?.ip?.message}
                                            {...register('accuweather_camera.ip', {
                                                pattern: {
                                                    value: /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/,
                                                    message: 'Set valid IP adress (xxx.xxx.xxx.xxx)',
                                                },
                                            })}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Controller
                                            name="accuweather_camera.port"
                                            control={control}
                                            rules={{
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
                                            }}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    fullWidth
                                                    label="Port"
                                                    error={errors?.accuweather_camera?.port != undefined}
                                                    helperText={errors?.accuweather_camera?.port?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Input fullWidth label="User" {...register('accuweather_camera.user')} />
                                    </Grid>
                                    <Grid item>
                                        <PasswordInput register={register} name="accuweather_camera.password" />
                                    </Grid>
                                </Grid>
                                <Grid item container rowSpacing={2} direction="column">
                                    <Grid item>
                                        <h3>Accuweather API</h3>
                                    </Grid>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Grid item>
                                        <Input
                                            fullWidth
                                            label="API key"
                                            error={errors?.accuweather?.APIkey != undefined}
                                            helperText={errors?.accuweather?.APIkey?.message}
                                            {...register('accuweather.APIkey')}
                                        />
                                    </Grid>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="units">Units</InputLabel>
                                        <Controller
                                            control={control}
                                            name="accuweather.units"
                                            render={({ field }) => (
                                                <StyledSelect labelId="units" label="Protocol" {...field}>
                                                    <MenuItem value="Metric">Metric</MenuItem>
                                                    <MenuItem value="Imperial">Imperial</MenuItem>
                                                </StyledSelect>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl
                                        error={errors?.accuweather?.refresh_period != undefined}
                                        fullWidth
                                        required
                                    >
                                        <InputLabel>Refresh period</InputLabel>
                                        <StyledOutlinedInput
                                            endAdornment={<InputAdornment position="end">seconds</InputAdornment>}
                                            label="Refresh period"
                                            {...register('accuweather.refresh_period', {
                                                required: { value: true, message: 'Refresh period is required' },
                                                pattern: {
                                                    value: /^[0-9]*$/,
                                                    message: 'Set number',
                                                },
                                            })}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item container rowSpacing={2} direction="column">
                                    <Grid item>
                                        <h3>CustomGraphics Settings</h3>
                                    </Grid>
                                </Grid>
                                <Grid item container rowSpacing={2} direction="column">
                                    <StyledApiValuesContent>
                                        <Typography>location:</Typography>
                                        <Input
                                            fullWidth
                                            label="CustomGraphics service ID"
                                            {...register('accuweather.location.serviceId', { valueAsNumber: true })}
                                        />
                                        <Input
                                            fullWidth
                                            label="CustomGraphics field name"
                                            {...register('accuweather.location.fieldName')}
                                        />

                                        <Typography>temperature:</Typography>
                                        <Input
                                            fullWidth
                                            label="CustomGraphics service ID"
                                            {...register('accuweather.temperature.serviceId', { valueAsNumber: true })}
                                        />
                                        <Input
                                            fullWidth
                                            label="CustomGraphics field name"
                                            {...register('accuweather.temperature.fieldName')}
                                        />

                                        <Typography>wind speed:</Typography>
                                        <Input
                                            fullWidth
                                            label="CustomGraphics service ID"
                                            {...register('accuweather.wind.serviceId', { valueAsNumber: true })}
                                        />
                                        <Input
                                            fullWidth
                                            label="CustomGraphics field name"
                                            {...register('accuweather.wind.fieldName')}
                                        />

                                        <Typography>wind gust:</Typography>
                                        <Input
                                            fullWidth
                                            label="CustomGraphics service ID"
                                            {...register('accuweather.wind_gust.serviceId', { valueAsNumber: true })}
                                        />
                                        <Input
                                            fullWidth
                                            label="CustomGraphics field name"
                                            {...register('accuweather.wind_gust.fieldName')}
                                        />

                                        <Typography>humidity:</Typography>
                                        <Input
                                            fullWidth
                                            label="CustomGraphics service ID"
                                            {...register('accuweather.humidity.serviceId', { valueAsNumber: true })}
                                        />
                                        <Input
                                            fullWidth
                                            label="CustomGraphics field name"
                                            {...register('accuweather.humidity.fieldName')}
                                        />
                                    </StyledApiValuesContent>
                                </Grid>
                            </Grid>
                        </CollapsibleFormSection>
                        <Grid item>
                            <SubmitButton
                                type="submit"
                                variant="contained"
                                disabled={Object.keys(errors).length > 0 || isSubmitting}
                                isSmallScreen={matchesSmallScreen}
                            >
                                {isSubmitting ? <CircularProgress size={20} /> : <Typography>Submit</Typography>}
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
    width: isSmallScreen ? '100%' : '50%',
    height: '40px',
}));

const StyledApiValuesContent = styled('div')({
    display: 'grid',
    gridTemplateColumns: 'max-content 250px 250px',
    gap: '16px',
    alignItems: 'center',
    marginTop: '16px',
});
