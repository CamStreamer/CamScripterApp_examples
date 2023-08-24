import React from 'react';
import { styled } from '@mui/material/styles';

export const Header = () => {
    return (
        <StyledContainer>
            <StyledLogo src="./assets/images/Teltonika-logo.png" alt="logo" />
        </StyledContainer>
    );
};

const StyledLogo = styled('img')({
    width: 'clamp(80%, 13vw, 90%)',
});
const StyledContainer = styled('div')({
    textAlign: 'center',
});
