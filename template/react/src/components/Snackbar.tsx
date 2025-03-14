import Slide, { SlideProps } from '@mui/material/Slide';
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';
import { Typography, IconButton } from '@mui/material';
import styled from '@mui/material/styles/styled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
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
        snackbarData !== null && (
            <Snackbar
                open
                anchorOrigin={matchesSmallScreen ? TRANSITION_PROPS_SMALL : TRANSITION_PROPS_LARGE}
                TransitionComponent={(props: SlideProps) => (
                    <Slide {...props} direction={matchesSmallScreen ? 'down' : 'up'} />
                )}
            >
                <StyledCont $severity={snackbarData.type}>
                    {snackbarData.type === 'success' ? <CheckCircleIcon /> : <CancelIcon />}
                    <StyledContent>
                        <Typography>{snackbarData.message}</Typography>
                    </StyledContent>
                    <StyledIconButton aria-label="close" color="inherit" size="small" onClick={closeSnackbar}>
                        <CloseIcon />
                    </StyledIconButton>
                </StyledCont>
            </Snackbar>
        )
    );
};

const StyledCont = styled('div')<{ $severity: 'error' | 'success' }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 8px;
    border-radius: 6px;
    background-color: #ffffff;
    border-left: 4px solid ${(props) => (props.$severity === 'success' ? SUCCESS_COLOR : ERROR_COLOR)};
    gap: 8px;
    box-shadow: 0px 8px 20px 0px #00000026;

    & > svg,
    & > i {
        color: ${(props) => (props.$severity === 'success' ? SUCCESS_COLOR : ERROR_COLOR)};
        padding: 2px;
    }
`;

const StyledContent = styled('div')`
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 12px;
`;

const StyledIconButton = styled(IconButton)`
    height: min-content;
    padding: 2px;

    & > svg {
        padding: 2px;
        min-width: 14px;
        color: #b7b7b7;
    }
`;

const SUCCESS_COLOR = '#28A745';
const ERROR_COLOR = '#DC3545';
