import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePage } from '@inertiajs/react';

/**
 * The one "sign in to continue" moment every guest interaction opens onto —
 * see resources/js/pages/Social/authGate.js for the hook that drives this.
 * Deliberately its own fixed dark card rather than inheriting the light
 * Vibrants page or the Kickoff broadcast palette behind it: this prompt can
 * appear over either (a feed post, a live stream, a profile), so it carries
 * a single consistent identity instead of two different skins depending on
 * where a guest happened to tap.
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

                <span className="mf-authgate__mark" aria-hidden>
                    ⚽
                </span>

                <h2 id="mf-authgate-title" className="mf-authgate__title">
                    {headline}
                </h2>
                <p className="mf-authgate__body">
                    You're browsing as a guest — create a free account to join in.
                </p>

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
