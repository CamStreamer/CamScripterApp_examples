import { Button, Dialog, Typography, Stack } from '@mui/material';
import styled from '@mui/material/styles/styled';
import { Title } from './Title';

type Props = {
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    children?: React.ReactNode;
    onClose: () => void;
    onConfirm: (volume?: number) => void;
};

export const Modal = ({ open, title, description, confirmText, onClose, children, onConfirm }: Props) => {
    return (
        <StyledDialog fullWidth maxWidth="md" onClose={onClose} open={open}>
            <Stack spacing={2}>
                <Title text={title} />
                <Typography>{description}</Typography>
                {children}
                <StyledButtonRow>
                    <Button variant="outlined" color="info" onClick={onClose}>
                        CANCEL
                    </Button>
                    <Button
                        variant="contained"
                        color="info"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </Button>
                </StyledButtonRow>
            </Stack>
        </StyledDialog>
    );
};

const StyledDialog = styled(Dialog)`
    gap: 16px;

    & .MuiDialog-paper {
        width: 90%;
        max-width: 600px;
        max-height: 584px;
        margin: 0 auto;
        padding: 30px;

        @media (max-width: 600px) {
            padding: 16px;
        }
    }

    & .MuiDialogContent-root {
        padding: 20px;
    }

    & .MuiDialogActions-root {
        padding: 20px;
    }
`;

const StyledButtonRow = styled('div')`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin: 12px 0;
`;
