import React, { useState } from 'react';

import { FormInput } from '../FormInput';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { UseFormRegister } from 'react-hook-form';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { styled } from '@mui/material/styles';

type Props = {
    register: UseFormRegister<FormInput>;
    name: 'co_camera.password' | 'map_camera.password' | 'accuweather_camera.password';
};

export function PasswordInput({ register, name }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    return (
        <Input
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
            {...register(name)}
        />
    );
}

const Input = styled(TextField)({
    backgroundColor: 'white',
});
