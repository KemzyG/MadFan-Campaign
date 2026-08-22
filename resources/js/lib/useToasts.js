import { useCallback, useRef, useState } from 'react';

/**
 * Same toast behavior as SocialShell's inline implementation (auto-dismiss,
 * capped stack), extracted so pages outside the Social shell can use it.
 */
export function useToasts() {
    const [toasts, setToasts] = useState([]);
    const toastId = useRef(0);

    const pushToast = useCallback((tone, message) => {
        const text = typeof message === 'string' ? message.trim() : '';
        if (!text) {
            return;
        }

        toastId.current += 1;
        const id = toastId.current;
        setToasts((current) => [...current.slice(-4), { id, tone, message: text }]);

        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 4200);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const reportError = useCallback(
        (message) => pushToast('err', message || 'Something went wrong.'),
        [pushToast],
    );
    const reportSuccess = useCallback((message) => pushToast('ok', message || 'Done.'), [pushToast]);

    return { toasts, pushToast, dismissToast, reportError, reportSuccess };
}
