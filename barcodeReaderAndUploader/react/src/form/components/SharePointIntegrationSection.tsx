import { Controller, useFormContext } from 'react-hook-form';
import { StyledFormValuesRow, StyledHorizontalDivider } from '../HelperComponents';

import InputAdornment from '@mui/material/InputAdornment';
import React from 'react';
import { TFormValues } from '../models/schema';
import TextField from '@mui/material/TextField';
import { WithLabel } from './WithLabel';
import { parseValueAsInt } from '../utils';

export const SharePointIntegrationSection = () => {
    const { control } = useFormContext<TFormValues>();

    return (
        <>
            <StyledFormValuesRow>
                <WithLabel label="SharePoint url" htmlFor="sharePointUrl">
                    <Controller
                        name="url"
                        control={control}
                        render={({ field, formState }) => (
                            <TextField
                                id="sharePointUrl"
                                aria-labelledby="sharePointUrl"
                                {...field}
                                fullWidth
                                error={!!formState.errors.url}
                                helperText={formState.errors.url?.message}
                            />
                        )}
                    />
                </WithLabel>
                <WithLabel label="SharePoint directory path" htmlFor="sharePointOutDir">
                    <Controller
                        name="outputDir"
                        control={control}
                        render={({ field, formState }) => (
                            <TextField
                                id="sharePointOutDir"
                                aria-labelledby="sharePointOutDir"
                                {...field}
                                fullWidth
                                error={!!formState.errors.outputDir}
                                helperText={formState.errors.outputDir?.message}
                            />
                        )}
                    />
                </WithLabel>
                <WithLabel label="Client secret" htmlFor="sharePointClientSecret">
                    <Controller
                        name="clientSecret"
                        control={control}
                        render={({ field, formState }) => (
                            <TextField
                                id="sharePointClientSecret"
                                aria-labelledby="sharePointClientSecret"
                                {...field}
                                fullWidth
                                error={!!formState.errors.clientSecret}
                                helperText={formState.errors.clientSecret?.message}
                            />
                        )}
                    />
                </WithLabel>
                <WithLabel label="Client ID" htmlFor="sharePointClientId">
                    <Controller
                        name="clientId"
                        control={control}
                        render={({ field, formState }) => (
                            <TextField
                                id="sharePointClientId"
                                aria-labelledby="sharePointClientId"
                                {...field}
                                fullWidth
                                error={!!formState.errors.clientId}
                                helperText={formState.errors.clientId?.message}
                            />
                        )}
                    />
                </WithLabel>
                <WithLabel label="Tenant ID" htmlFor="sharePointTenantId">
                    <Controller
                        name="tenantId"
                        control={control}
                        render={({ field, formState }) => (
                            <TextField
                                id="sharePointTenantId"
                                aria-labelledby="sharePointTenantId"
                                {...field}
                                fullWidth
                                error={!!formState.errors.tenantId}
                                helperText={formState.errors.tenantId?.message}
                            />
                        )}
                    />
                </WithLabel>
            </StyledFormValuesRow>
            <StyledHorizontalDivider />
            <StyledFormValuesRow>
                <WithLabel label="Connection timeout" htmlFor="sharePointConnetionTimeout">
                    <Controller
                        name="connectionTimeoutS"
                        control={control}
                        render={({ field, formState }) => (
                            <TextField
                                id="sharePointConnetionTimeout"
                                aria-labelledby="sharePointConnetionTimeout"
                                type="number"
                                {...field}
                                onChange={(e) => {
                                    field.onChange(parseValueAsInt(e.target.value));
                                }}
                                fullWidth
                                error={!!formState.errors.connectionTimeoutS}
                                helperText={formState.errors.connectionTimeoutS?.message}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end" disableTypography>
                                            s
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}
                    />
                </WithLabel>
                <WithLabel label="Upload timeout" htmlFor="sharePointUploadTimeout">
                    <Controller
                        name="uploadTimeoutS"
                        control={control}
                        render={({ field, formState }) => (
                            <TextField
                                id="sharePointUploadTimeout"
                                aria-labelledby="sharePointUploadTimeout"
                                type="number"
                                {...field}
                                onChange={(e) => {
                                    field.onChange(parseValueAsInt(e.target.value));
                                }}
                                fullWidth
                                error={!!formState.errors.uploadTimeoutS}
                                helperText={formState.errors.uploadTimeoutS?.message}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end" disableTypography>
                                            s
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}
                    />
                </WithLabel>
                <WithLabel label="Number of retries" htmlFor="sharePointNumOfRetries">
                    <Controller
                        name="numberOfRetries"
                        control={control}
                        render={({ field, formState }) => (
                            <TextField
                                id="sharePointNumOfRetries"
                                aria-labelledby="sharePointNumOfRetries"
                                type="number"
                                {...field}
                                onChange={(e) => {
                                    field.onChange(parseValueAsInt(e.target.value));
                                }}
                                fullWidth
                                error={!!formState.errors.numberOfRetries}
                                helperText={formState.errors.numberOfRetries?.message}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end" disableTypography>
                                            s
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}
                    />
                </WithLabel>
            </StyledFormValuesRow>
        </>
    );
};
