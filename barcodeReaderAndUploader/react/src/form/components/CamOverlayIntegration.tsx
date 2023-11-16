import { Controller, useFormContext } from 'react-hook-form';
import { FormLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { StyledFormValuesRow, StyledHorizontalDivider } from '../HelperComponents';

import { CamOverlaySettings } from './CamOverlaySettings';
import { PasswordInput } from './PasswordInput';
import React from 'react';
import { SubSectionLabel } from './SubSectionLabel';
import { TFormValues } from '../models/schema';
import { WithLabel } from './WithLabel';

export const CamOverlayIntegration = () => {
    const { control } = useFormContext<TFormValues>();
    return (
        <>
            <SubSectionLabel text="Camera Settings" />
            <StyledFormValuesRow>
                <WithLabel label="Protocol" htmlFor="cameraProtocol">
                    <Controller
                        name="protocol"
                        control={control}
                        render={({ field }) => (
                            <Select id="cameraProtocol" aria-labelledby="cameraProtocol" {...field} fullWidth>
                                <MenuItem key="http" value="http">HTTP</MenuItem>
                                <MenuItem key="https" value="https">HTTPS</MenuItem>
                                <MenuItem key="https_insecure" value="https_insecure">HTTPS (insecure)</MenuItem>
                            </Select>
                        )}
                    />
                </WithLabel>
                <WithLabel label="IP" htmlFor="cameraIP">
                    <Controller
                        name="ip"
                        control={control}
                        render={({ field, formState }) => (
                            <TextField
                                id="cameraIP"
                                aria-labelledby="cameraIP"
                                {...field}
                                fullWidth
                                error={!!formState.errors.ip}
                                helperText={formState.errors.ip?.message}
                            />
                        )}
                    />
                </WithLabel>
                <WithLabel label="Port" htmlFor="cameraPort">
                    <Controller
                        name="port"
                        control={control}
                        render={({ field, formState }) => (
                            <TextField
                                id="cameraPort"
                                aria-labelledby="cameraPort"
                                {...field}
                                fullWidth
                                error={!!formState.errors.port}
                                helperText={formState.errors.port?.message}
                            />
                        )}
                    />
                </WithLabel>
                <WithLabel label="User" htmlFor="cameraUser">
                    <Controller
                        name="user"
                        control={control}
                        render={({ field, formState }) => (
                            <TextField
                                id="cameraUser"
                                aria-labelledby="cameraUser"
                                {...field}
                                fullWidth
                                error={!!formState.errors.user}
                                helperText={formState.errors.user?.message}
                            />
                        )}
                    />
                </WithLabel>
                <WithLabel label="Password" htmlFor="cameraPass">
                    <Controller
                        name="pass"
                        control={control}
                        render={({ field, formState }) => (
                            <PasswordInput
                                id="cameraPass"
                                aria-labelledby="cameraPass"
                                {...field}
                                fullWidth
                                error={!!formState.errors.pass}
                                helperText={formState.errors.pass?.message}
                            />
                        )}
                    />
                </WithLabel>
            </StyledFormValuesRow>
            <StyledHorizontalDivider />
            <SubSectionLabel text="CamOverlay Settings" />
            <CamOverlaySettings />
        </>
    );
};
