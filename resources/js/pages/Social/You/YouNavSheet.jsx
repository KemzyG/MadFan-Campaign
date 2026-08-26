import { Link } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { useEffect, useId } from 'react';
import { IconClose } from '../components/post/icons';
import { IconBell, IconCampaign, IconShop, IconSport, IconStage } from '../../../Layouts/SocialShell';

function IconLogout() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H9" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15.5 16 20 12l-4.5-4M20 12H9.5" />
        </svg>
    );
}

const LINKS = [
    { href: '/social/notifications', label: 'Notifications', hint: 'Mentions, replies & alerts', icon: IconBell, showCount: true },
    { href: '/social/sport', label: 'Sport', hint: 'Fixtures, table & clubs', icon: IconSport },
    { href: '/social/shop', label: 'Store', hint: 'Kit & merch', icon: IconShop },
    { href: '/social/stage', label: 'Join stage', hint: 'Live voice rooms', icon: IconStage },
    { href: '/campaign', label: 'Campaign', hint: 'The wider Mad Fan app', icon: IconCampaign },
];

/**
 * Bottom sheet for the destinations that don't fit the bottom tab bar — opened
 * from {@link YouHeader}'s menu button, the one place that access moves to once
 * the generic SocialShell header is hidden on this page (see `hideHeaderOnMobile`).
 */
export default function YouNavSheet({ open, onClose, notificationsCount = 0 }) {
    const titleId = useId();

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return createPortal(
        <div className="mf-sheet" role="presentation">
            <button type="button" className="mf-sheet__backdrop" aria-label="Close menu" onClick={onClose} />
            <div
                className="mf-sheet__panel mf-you-nav"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div className="mf-sheet__handle" aria-hidden />

                <div className="mf-sheet__head">
                    <p id={titleId} className="mf-display mf-text-title tracking-[0.03em]">
                        Menu
                    </p>
                    <button type="button" className="mf-stage-icon-btn" aria-label="Close" title="Close" onClick={onClose}>
                        <IconClose />
                    </button>
                </div>

                <ul className="mf-you-nav__list" role="none">
                    {LINKS.map(({ href, label, hint, icon: Icon, showCount }) => (
                        <li key={href} role="none">
                            <Link href={href} className="mf-you-nav__item" onClick={onClose} prefetch>
                                <span className="mf-you-nav__item-icon" aria-hidden>
                                    <Icon />
                                </span>
                                <span className="mf-you-nav__item-copy">
                                    <span className="mf-you-nav__item-label">{label}</span>
                                    <span className="mf-text-caption mf-you-nav__item-hint">{hint}</span>
                                </span>
                                {showCount && notificationsCount > 0 ? (
                                    <span className="mf-you-nav__item-badge mf-mono">
                                        {notificationsCount > 99 ? '99+' : notificationsCount}
                                    </span>
                                ) : null}
                            </Link>
                        </li>
                    ))}

                    <li className="mf-you-nav__sep" role="separator" aria-hidden="true" />

                    <li role="none">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="mf-you-nav__item is-danger"
                        >
                            <span className="mf-you-nav__item-icon" aria-hidden>
                                <IconLogout />
                            </span>
                            <span className="mf-you-nav__item-copy">
                                <span className="mf-you-nav__item-label">Sign out</span>
                            </span>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>,
        document.body,
    );
}
