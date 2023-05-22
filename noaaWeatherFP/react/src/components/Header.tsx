import Box from '@mui/material/Box';
import React from 'react';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

export const Header = () => {
    return (
        <StyledWrapper>
            <StyledLogo src="./assets/images/noaa_digital_logo.svg" alt="logo" />
            <StyledTitle variant="h2">NOAA Weather FP</StyledTitle>
        </StyledWrapper>
    );
};

const StyledWrapper = styled(Box)({
    display: 'grid',
    placeItems: 'center',
    gap: '1em',
});

const StyledLogo = styled('img')({
    width: 'clamp(4rem, 13vw, 7rem)',
});

const StyledTitle = styled(Typography)({
    fontSize: 'clamp(1.75rem, 7vw, 3.75rem)',
    opacity: 0.9,
});
