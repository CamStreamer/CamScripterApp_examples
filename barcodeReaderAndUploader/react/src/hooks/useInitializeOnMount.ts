import { useEffect, useRef } from 'react';

export const useInitializeOnMount = (cb: () => void) => {
    const mounted = useRef(false);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            cb();
        }
    });
};
