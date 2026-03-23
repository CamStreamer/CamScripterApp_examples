import { Controller, useFormContext } from 'react-hook-form';
import { IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';

import { TSettings } from '../models/schema';
import { CollapsibleFormSection } from '../components/CollapsibleFormSection';
import { StyledTextField, StyledForm, StyledRow } from '../components/FormInputs';

export const CameraConnectionSection = () => {
    const { control } = useFormContext<TSettings>();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <CollapsibleFormSection label="Camera Connection" defaultExpanded={true}>
            <StyledForm>
                <StyledRow>
                    <Controller
                        name="camera_ip"
                        control={control}
                        render={({ field, fieldState }) => (
                            <StyledTextField
                                {...field}
                                label="Camera IP"
                                placeholder="127.0.0.1"
                                size="small"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            />
                        )}
                    />
                    <Controller
                        name="camera_port"
                        control={control}
                        render={({ field, fieldState }) => (
                            <StyledTextField
                                {...field}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 0)}
                                label="Camera Port"
                                placeholder="80"
                                size="small"
                                type="number"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            />
                        )}
                    />
                </StyledRow>
                <StyledRow>
                    <Controller
                        name="camera_user"
                        control={control}
                        render={({ field, fieldState }) => (
                            <StyledTextField
                                {...field}
                                label="Camera User"
                                placeholder="root"
                                size="small"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            />
                        )}
                    />
                    <Controller
                        name="camera_pass"
                        control={control}
                        render={({ field, fieldState }) => (
                            <StyledTextField
                                {...field}
                                label="Camera Password"
                                placeholder="password"
                                size="small"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                edge="end"
                                                size="small"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}
                    />
                </StyledRow>
            </StyledForm>
        </CollapsibleFormSection>
    );
};
