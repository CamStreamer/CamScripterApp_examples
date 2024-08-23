import { useState } from 'react';

import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Control, Controller } from 'react-hook-form';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { TSettings } from '../models/schema';
import { StyledTextField } from './FormInputs';
import { getErrorObject } from '../utils';

type Props = {
    areCredentialsValid?: boolean;
    control: Control<TSettings>;
    name: 'acs.pass' | `cameras.${number}.pass`;
    onBlur?: () => void;
};

export const PasswordInput = ({ control, name, onBlur, areCredentialsValid = true }: Props) => {
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field, formState }) => (
                <StyledTextField
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    label="Password"
                    InputLabelProps={{ shrink: true }}
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
                    error={!areCredentialsValid || getErrorObject(formState.errors, name)?.pass !== undefined}
                    helperText={
                        areCredentialsValid
                            ? getErrorObject(formState.errors, name)?.pass?.message
                            : 'Wrong credentials'
                    }
                    onBlur={() => {
                        field.onBlur();
                        onBlur?.();
                    }}
                />
            )}
        />
    );
};
