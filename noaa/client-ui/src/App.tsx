import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import { Form } from './Form';
import { Header } from './Header';
import React, { useState } from 'react';
import styles from './App.module.css';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import './Global.module.css';
import { Nav } from './Nav';

export const App = () => {
    const [isFormInitialized, setIsFormInitialized] = useState(false);

    return (
        <>
            <Nav />
            <Container className={styles.container}>
                <CssBaseline />
                <Box className={styles.contentWrapper}>
                    <Fade in={isFormInitialized} className={styles.boxShadow} timeout={1000}>
                        <Box />
                    </Fade>
                    <Header />
                    <Form isFormInitialized={isFormInitialized} setIsFormInitialized={setIsFormInitialized} />
                </Box>
            </Container>
        </>
    );
};
