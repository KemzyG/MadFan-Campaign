import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePage } from '@inertiajs/react';
import FanBrandLogo from '../../../Components/Fan/FanBrandLogo';

/**
 * The one "sign in to continue" moment every guest interaction opens onto —
 * see resources/js/pages/Social/authGate.js for the hook that drives this.
 * Minimal on purpose: logo, one line, two buttons — no pitch copy.
 */
export default function SignInGate({ action, onClose }) {
    const open = Boolean(action);
    const currentUrl = usePage().url || '/';

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const redirect = encodeURIComponent(currentUrl);
    const headline = typeof action === 'string' ? `Sign in to ${action}` : 'Sign in to continue';

    return createPortal(
        <div className="mf-authgate" role="presentation">
            <button type="button" className="mf-authgate__backdrop" aria-label="Close" onClick={onClose} />
            <div className="mf-authgate__card" role="dialog" aria-modal="true" aria-labelledby="mf-authgate-title">
                <button type="button" className="mf-authgate__close" aria-label="Close" onClick={onClose}>
                    ×
                </button>

                <FanBrandLogo asLink={false} size={40} className="mf-authgate__mark" />

                <h2 id="mf-authgate-title" className="mf-authgate__title">
                    {headline}
                </h2>

                <div className="mf-authgate__actions">
                    <a className="mf-authgate__btn mf-authgate__btn--primary" href={`/login?redirect=${redirect}`}>
                        Sign in
                    </a>
                    <a className="mf-authgate__btn mf-authgate__btn--secondary" href={`/register?redirect=${redirect}`}>
                        Create account
                    </a>
                </div>

                <button type="button" className="mf-authgate__dismiss" onClick={onClose}>
                    Not now
                </button>
            </div>
        </div>,
        document.body,
    );
}
