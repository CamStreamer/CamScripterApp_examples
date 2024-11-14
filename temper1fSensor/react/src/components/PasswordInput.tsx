import { useState } from 'react';

import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Control, Controller, Path } from 'react-hook-form';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { StyledTextField } from './FormInputs';

type Props<Schema extends Record<string, unknown>> = {
    areCredentialsValid?: boolean;
    control: Control<Schema>;
    name: Path<Schema>;
    onBlur?: () => void;
    onChange?: () => void;
};

export const PasswordInput = <Schema extends Record<string, unknown>>({
    control,
    name,
    onBlur,
    onChange,
    areCredentialsValid = true,
}: Props<Schema>) => {
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field, formState }) => {
                const msg = formState.errors?.[name]?.message;
                return (
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
                        error={!areCredentialsValid || msg !== undefined}
                        helperText={
                            areCredentialsValid ? (typeof msg === 'string' ? msg : undefined) : 'Wrong credentials'
                        }
                        onBlur={() => {
                            field.onBlur();
                            onBlur?.();
                        }}
                        onChange={(event) => {
                            field.onChange(event);
                            onChange?.();
                        }}
                    />
                );
            }}
        />
    );
};
