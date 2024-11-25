import Slide, { SlideProps } from '@mui/material/Slide';
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';

import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';

type SnackData = {
    type: 'error' | 'success';
    message: string;
};
type Props = {
    snackbarData: SnackData | null;
    closeSnackbar: () => void;
};

const TRANSITION_PROPS_LARGE: SnackbarOrigin = { vertical: 'bottom', horizontal: 'left' };
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
        >
            <Alert severity={snackbarData?.type} variant="filled" onClose={closeSnackbar}>
                {snackbarData && snackbarData.message}
            </Alert>
        </Snackbar>
    );
};
