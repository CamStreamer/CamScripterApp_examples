import { useState } from 'react';

import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Control, Controller } from 'react-hook-form';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { TSettings } from '../models/schema';
import { StyledTextField } from './FormInputs';

type Props = {
    areCredentialsValid?: boolean;
    control: Control<TSettings>;
    onBlur?: () => void;
};

export function PasswordInput({ control, onBlur, areCredentialsValid }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    return (
        <Controller
            name={'camera_pass'}
            control={control}
            render={({ field, formState }) => (
                <StyledTextField
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    label="Password"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowPassword}
                                    onMouseDown={(e) => e.preventDefault()}
                                    edge="end"
                                >
                                    {showPassword ? <Visibility /> : <VisibilityOff />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    error={!areCredentialsValid || formState.errors.camera_pass !== undefined}
                    helperText={areCredentialsValid ? formState.errors.camera_pass?.message : 'Wrong credentials'}
                    onBlur={() => {
                        field.onBlur();
                        onBlur?.();
                    }}
                />
            )}
        />
    );
}
