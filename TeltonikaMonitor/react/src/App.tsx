import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Container from '@mui/material/Container';
import styled from '@mui/material/styles/styled';
import CssBaseline from '@mui/material/CssBaseline';

import { Nav } from './components/Nav';
import { Form } from './components/Form';
import { Header } from './components/Header';

export const App = () => {
    const [initialized, setInitialized] = useState(false);
    return (
        <>
            <Nav />
            <StyledContainer>
                <CssBaseline />
                <StyledContentWrapper>
                    <StyledShadowBox in={initialized} timeout={1000}>
                        <Box />
                    </StyledShadowBox>
                    <Header />
                    <Form initialized={initialized} setInitialized={setInitialized} />
                </StyledContentWrapper>
            </StyledContainer>
        </>
    );
};

const StyledContainer = styled(Container)({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    alignItems: 'center',
});
const StyledShadowBox = styled(Fade)({
    position: 'absolute',
    inset: 0,
    boxShadow: '3px 3px 7px 0px rgba(0, 0, 0, 0.5)',
    zIndex: -1,
    bordeRadius: '20px',
});
const StyledContentWrapper = styled(Box)({
    width: '100%',
    marginBlock: '2em',
    display: 'flex',
    flexDirection: 'column',
    gap: '4em',
    padding: '4em 2em',
    position: 'relative',
});
