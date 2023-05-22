import React from 'react';
import Typography, { TypographyProps } from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

export const Nav = () => {
    return (
        <StyledNav>
            <StyledLink href="#">
                <StyledImage src="./assets/images/logo_cs.png" alt="camscripter-logo" />{' '}
                <StyledText>CamScripter </StyledText>
            </StyledLink>
        </StyledNav>
    );
};

const StyledNav = styled('nav')({
    backgroundColor: '#15273d',
    padding: '0.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
});

const StyledLink = styled('a')({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    color: 'inherit',
});

const StyledImage = styled('img')({
    width: '3em',
});

const StyledText = styled(Typography)({
    fontSize: '1.2em',
});
