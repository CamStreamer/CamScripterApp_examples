import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import { Form } from './Form';
import { Header } from './Header';
import React from 'react';

export const App = () => {
    return (
        <Container style={style.container}>
            <CssBaseline />
            <Header />
            <Form />
        </Container>
    );
};

const style: TStyleSheet = {
    container: {
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
    },
};
