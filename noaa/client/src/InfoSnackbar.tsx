import Slide, { SlideProps } from '@mui/material/Slide';
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';

import Alert from '@mui/material/Alert';
import React from 'react';

type Props = {
    isSmallScreen: boolean;
    snackbarData: TSnackData | null;
    closeSnackbar: () => void;
};

const TRANSITION_PROPS_LARGE: SnackbarOrigin = { vertical: 'bottom', horizontal: 'right' };
const TRANSITION_PROPS_SMALL: SnackbarOrigin = { vertical: 'top', horizontal: 'center' };

export const InfoSnackbar = ({ isSmallScreen, snackbarData, closeSnackbar }: Props) => (
    <Snackbar
        open={!!snackbarData}
        anchorOrigin={isSmallScreen ? TRANSITION_PROPS_SMALL : TRANSITION_PROPS_LARGE}
        TransitionComponent={(props: SlideProps) => <Slide {...props} direction={isSmallScreen ? 'down' : 'up'} />}
    >
        <Alert severity={snackbarData?.type} variant="filled" onClose={closeSnackbar}>
            {snackbarData && snackbarData.message}
        </Alert>
    </Snackbar>
);
