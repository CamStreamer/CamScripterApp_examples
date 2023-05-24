import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import { Form } from './components/Form';
import { Header } from './components/Header';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import { Nav } from './components/Nav';
import { styled } from '@mui/material/styles';

export const App = () => {
    const [isFormInitialized, setIsFormInitialized] = useState(false);

    return (
        <>
            <Nav />
            <StyledContainer>
                <CssBaseline />
                <StyledContentWrapper>
                    <StyledBoxShadow in={isFormInitialized} timeout={1000}>
                        <Box />
                    </StyledBoxShadow>
                    <Header />
                    <Form isFormInitialized={isFormInitialized} setIsFormInitialized={setIsFormInitialized} />
                </StyledContentWrapper>
            </StyledContainer>
        </>
    );
};

const StyledContainer = styled(Container)({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    alignItems: 'center',
});

const StyledContentWrapper = styled(Box)({
    width: 'max-content',
    marginBlock: '2em',
    display: 'flex',
    flexDirection: 'column',
    gap: '4em',
    padding: '4em 2em',
    position: 'relative',
});

const StyledBoxShadow = styled(Fade)({
    position: 'absolute',
    inset: 0,
    boxShadow: '3px 3px 7px 0px rgba(0, 0, 0, 0.5)',
    zIndex: -1,
    bordeRadius: '20px',
});
