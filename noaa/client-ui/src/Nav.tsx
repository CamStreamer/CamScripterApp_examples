import React from 'react';
import styles from './Nav.module.css';
import Typography from '@mui/material/Typography';

type Props = {};

export const Nav = (props: Props) => {
    return (
        <nav className={styles.nav}>
            <a href="#" className={styles.link}>
                <img src="./assets/images/logo_cs.png" alt="camscripter-logo" className={styles.img} />{' '}
                <Typography className={styles.text}>CamScripter </Typography>
            </a>
        </nav>
    );
};
