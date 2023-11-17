import Alert, { AlertProps } from '@mui/material/Alert';
import Slide, { SlideProps } from '@mui/material/Slide';
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';

import React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

const SNACK_TIMEOUT = 5000;

export type TSnackBarData = {
    id: string;
    type: AlertProps['severity'];
    message: string;
};

type Props = {
    snackbarData: TSnackBarData | null;
    closeSnackbar: () => void;
};

const TRANSITION_PROPS_LARGE: SnackbarOrigin = { vertical: 'bottom', horizontal: 'right' };
const TRANSITION_PROPS_SMALL: SnackbarOrigin = { vertical: 'top', horizontal: 'center' };

export const InfoSnackbar = ({ snackbarData, closeSnackbar }: Props) => {
    const matchesSmallScreen = useMediaQuery('(max-width:390px)');

    return (
        <Snackbar
            open={!!snackbarData}
            anchorOrigin={matchesSmallScreen ? TRANSITION_PROPS_SMALL : TRANSITION_PROPS_LARGE}
            TransitionComponent={(props: SlideProps) => (
                <Slide {...props} direction={matchesSmallScreen ? 'down' : 'up'} />
            )}
            autoHideDuration={SNACK_TIMEOUT}
            onClose={closeSnackbar}
        >
            <Alert severity={snackbarData?.type} variant="filled" onClose={closeSnackbar}>
                {snackbarData && snackbarData.message}
            </Alert>
        </Snackbar>
    );
};
