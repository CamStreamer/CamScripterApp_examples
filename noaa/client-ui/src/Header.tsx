import Box from '@mui/material/Box';
import React from 'react';
import Typography from '@mui/material/Typography';

export const Header = () => {
    return (
        <Box style={style.box}>
            <img style={style.img} src="./assets/images/noaa_digital_logo.svg" alt="logo" />
            <Typography variant="h2" style={style.title}>
                NOA Weather FP
            </Typography>
        </Box>
    );
};

const style: TStyleSheet = {
    box: {
        display: 'grid',
        placeItems: 'center',
        paddingBlock: '4rem',
        gap: '1rem',
    },
    title: {
        fontSize: 'clamp(1.75rem, 7vw, 3.75rem)',
    },
    img: {
        width: 'clamp(4rem, 13vw, 7rem)',
    },
};
