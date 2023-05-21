import React from 'react';
import styles from './Nav.module.css';
import Typography from '@mui/material/Typography';

type Props = {};

export const Nav = (props: Props) => {
    return (
        <nav className={styles.nav}>
            <a href="#" className={styles.link}>
                <img src="./assets/images/logo_cs.png" alt="scs-logo" /> <Typography>CamScripter </Typography>
            </a>
        </nav>
    );
};
