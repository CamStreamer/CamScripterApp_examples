import React, { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import Button from '@mui/material/Button';
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

export const Form = (props: Props) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: {
            stationId: 0,
            locationName: 'a',
            cameraIp: 'a',
            cameraPort: 80,
            cameraUser: 'a',
            cameraPass: 'a',
            cgServiceId: 0,
            cgFieldName: 'a',
            itServiceId: 0,
            dataRefreshRateS: 120,
        },
    });

    useEffect(() => {
        (async () => {
            const resp = await fetch('/local/camscripter/package/settings.cgi?package_name=noaa&action=get');
            const data: TServerData = await resp.json();
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
        await fetch('/local/camscripter/package/settings.cgi?package_name=noaa&action=set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(toPost),
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container rowSpacing={2} direction="column">
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
                    <Button type="submit" variant="contained" disabled={Object.keys(errors).length > 0}>
                        Submit
                    </Button>
                </Grid>
            </Grid>
        </form>
    );
};
