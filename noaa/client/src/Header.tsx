import Box from '@mui/material/Box';
import React from 'react';
import Typography from '@mui/material/Typography';

type Props = {};

export const Header = (props: Props) => {
    return (
        <Box style={style.box}>
            <Typography variant="h2">NOA Weather FP</Typography>
        </Box>
    );
};

const style: TStyleSheet = {
    box: {
        display: 'grid',
        placeItems: 'center',
        paddingBlock: '4rem',
    },
};
