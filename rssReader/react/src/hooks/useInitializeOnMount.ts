import { useEffect, useRef } from 'react';

export const useInitializeOnMount = (cb: () => void | Promise<void>) => {
    const mounted = useRef(false);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            void cb();
        }
    });
};
