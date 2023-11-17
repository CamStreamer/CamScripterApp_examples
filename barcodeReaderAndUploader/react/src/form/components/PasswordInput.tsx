import TextField, { TextFieldProps } from '@mui/material/TextField';

import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import React from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export const PasswordInput = React.forwardRef<HTMLInputElement, TextFieldProps>(({ ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    return (
        <TextField
            type={showPassword ? 'text' : 'password'}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                        >
                            {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                    </InputAdornment>
                ),
            }}
            inputRef={ref}
            {...props}
        />
    );
});
