import Box from '@mui/material/Box';
import React from 'react';
import Typography from '@mui/material/Typography';
import styles from './Header.module.css';

export const Header = () => {
    return (
        <Box className={styles.box}>
            <img className={styles.img} src="./assets/images/noaa_digital_logo.svg" alt="logo" />
            <Typography variant="h2" className={styles.title}>
                NOA Weather FP
            </Typography>
        </Box>
    );
};
