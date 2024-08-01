import { useState } from 'react';

import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Control, Controller } from 'react-hook-form';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { TServerData } from '../models/schema';
import { StyledTextField } from './FormInputs';

type Props = {
    control: Control<TServerData>;
    name: `cameras.${number}.pass` | 'acs.pass';
};

export function PasswordInput({ control, name }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const index = parseInt(name.split(':')[1]);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field, formState }) => (
                <StyledTextField
                    {...field}
                    InputLabelProps={{ shrink: true }}
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
                    error={formState?.errors?.['cameras']?.[index]?.['pass'] !== undefined}
                    helperText={formState?.errors?.['cameras']?.[index]?.['pass']?.message}
                />
            )}
        />
    );
}
