import { useState } from 'react';

import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Control, Controller } from 'react-hook-form';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { TServerData } from '../models/schema';
import { StyledTextField } from './FormInputs';

type Props = {
    areCredentialsValid?: boolean;
    control: Control<TServerData>;
    name: 'source_camera.pass' | 'output_camera.pass';
    onBlur?: () => void;
};

export function PasswordInput({ control, name, onBlur, areCredentialsValid }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const [name1, name2] = name.split('.') as ['source_camera' | 'output_camera', 'pass'];

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
                    error={!areCredentialsValid || formState.errors[name1]?.[name2] !== undefined}
                    helperText={areCredentialsValid ? formState.errors[name1]?.[name2]?.message : 'Wrong credentials'}
                    onBlur={() => {
                        field.onBlur();
                        onBlur?.();
                    }}
                />
            )}
        />
    );
}
