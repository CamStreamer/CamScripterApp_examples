import { useRef, useState } from 'react';

const SNACK_TIMEOUT = 5000;

export type TSnackData = {
    type: 'error' | 'success';
    message: string;
};
export const useSnackbar = () => {
    const [snackbarData, setSnackbarData] = useState<null | TSnackData>(null);

    const snackbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const displaySnackbar = (data: TSnackData) => {
        setSnackbarData(data);
        if (snackbarTimeoutRef.current) {
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
