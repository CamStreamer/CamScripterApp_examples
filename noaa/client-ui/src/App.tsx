import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import { Form } from './Form';
import { Header } from './Header';
import React, { useState } from 'react';
import styles from './App.module.css';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import './Global.module.css';

export const App = () => {
    const [isFormInitialized, setIsFormInitialized] = useState(false);

    return (
        <Container style={style.container}>
            <CssBaseline />
            <Box className={styles.contentWrapper}>
                <Fade in={isFormInitialized} className={styles.boxShadow} timeout={1000}>
                    <Box />
                </Fade>
                <Header />
                <Form isFormInitialized={isFormInitialized} setIsFormInitialized={setIsFormInitialized} />
            </Box>
        </Container>
    );
};

const style: TStyleSheet = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        alignItems: 'center',
    },
};
