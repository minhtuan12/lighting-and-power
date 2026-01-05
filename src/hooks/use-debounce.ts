import { useCallback, useRef } from 'react';

export default function useDebounce(fn: (...args: any[]) => void, delay = 500) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback((...args: any[]) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            fn(...args);
        }, delay);
    }, [fn, delay]);
}
