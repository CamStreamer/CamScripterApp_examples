import { Container } from '@mui/material';
import { Nav } from './components/Nav';
import React from 'react';

type Props = {};

export const App = (props: Props) => {
    return (
        <>
            <Nav />
            <Container></Container>
        </>
    );
};
