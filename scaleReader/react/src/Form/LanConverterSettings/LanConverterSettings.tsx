import styled from '@mui/material/styles/styled';
import { Grid, Stack, InputAdornment } from '@mui/material';
import { StyledTextField } from '../../components/FormInputs';
import { Controller, useFormContext } from 'react-hook-form';
import { TAppSchema } from '../../models/schema';

export const LanConverterSettings = () => {
    const { control } = useFormContext<TAppSchema>();

    return (
        <StyledGrid container>
            <Grid item md={6} xs={12}>
                <Stack spacing={1.5}>
                    {/* ------IP ADDRESS------*/}
                    <Controller
                        name={`scale.ip`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="IP address"
                                error={formState.errors.scale?.ip !== undefined}
                                helperText={formState.errors.scale?.ip?.message}
                            />
                        )}
                    />
                    {/* ------PORT------*/}
                    <Controller
                        name={`scale.port`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="Port"
                                error={formState.errors.scale?.port !== undefined}
                                helperText={formState.errors.scale?.port?.message}
                            />
                        )}
                    />
                </Stack>
            </Grid>
            <Grid item md={6} xs={12}>
                <Stack spacing={1.5}>
                    {/* ------REFRESH RATE------*/}
                    <Controller
                        name={`scale.refresh_rate`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="Refresh Rate"
                                error={formState.errors.scale?.refresh_rate !== undefined}
                                helperText={formState.errors.scale?.refresh_rate?.message}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">ms</InputAdornment>,
                                }}
                            />
                        )}
                    />
                </Stack>
            </Grid>
        </StyledGrid>
    );
};

const StyledGrid = styled(Grid)`
    margin-bottom: 15px;
`;
