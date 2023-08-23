import React from 'react';
import { styled } from '@mui/material/styles';

export const Header = () => {
    return (
        <center>
            <StyledLogo src="./assets/images/Teltonika-logo.png" alt="logo" />
        </center>
    );
};

const StyledLogo = styled('img')({
    width: 'clamp(80%, 13vw, 90%)',
    textAlign: 'center',
});
