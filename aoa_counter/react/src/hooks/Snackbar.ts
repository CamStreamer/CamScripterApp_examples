import { useRef, useState } from 'react';

const SNACK_TIMEOUT = 5000;

type SnackData = {
    type: 'error' | 'success';
    message: string;
};
export const useSnackbar = () => {
    const [snackbarData, setSnackbarData] = useState<null | SnackData>(null);

    const snackbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const displaySnackbar = (data: SnackData) => {
        setSnackbarData(data);
        if (snackbarTimeoutRef.current !== null) {
            clearTimeout(snackbarTimeoutRef.current);
        }
        snackbarTimeoutRef.current = setTimeout(() => {
            setSnackbarData(null);
            snackbarTimeoutRef.current = null;
        }, SNACK_TIMEOUT);
    };

    const closeSnackbar = () => setSnackbarData(null);

    return { snackbarData, displaySnackbar, closeSnackbar } as const;
};
