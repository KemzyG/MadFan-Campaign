import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { CAMPAIGN_NAV_LINKS } from './campaignNavLinks';

export default function CampaignNav({
    open,
    onClose,
    drawerOnly = false,
    registerUrl = '/register',
}) {
    const page = usePage();
    const { auth } = page.props;
    const pathname = (page.url ?? '').split('?')[0];
    const isGuest = !auth?.user;
    const isLoginPage = pathname === '/login';
    const isRegisterPage = pathname === '/register';

    const guestLinks = isGuest ? (
        <>
            {/* Plain anchors: /login renders in the dark Social shell, which
                needs a full navigation to load its bundle/styles. */}
            <a
                href="/login"
                className={`campaign-nav-drawer-link${isLoginPage ? ' active' : ''}`}
                onClick={onClose}
            >
                Enter Campaign
            </a>
            <a
                href={registerUrl}
                className={`campaign-nav-drawer-link primary${isRegisterPage ? ' active' : ''}`}
                onClick={onClose}
            >
                Join Waitlist
            </a>
        </>
    ) : null;

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    return (
        <>
            {!drawerOnly && (
                <nav className="campaign-nav" aria-label="Campaign navigation">
                    {CAMPAIGN_NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`campaign-nav-link${pathname === link.href ? ' active' : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {!isGuest && (
                        <Link
                            href="/dashboard"
                            className={`campaign-nav-link${pathname === '/dashboard' ? ' active' : ''}`}
                        >
                            Dashboard
                        </Link>
                    )}
                    {!isGuest && auth?.user?.staff_active && (
                        <Link
                            href="/staff"
                            className={`campaign-nav-link${pathname === '/staff' ? ' active' : ''}`}
                        >
                            Staff
                        </Link>
                    )}
                    {isGuest && (
                        <>
                            <a href="/login" className={`campaign-nav-link${isLoginPage ? ' active' : ''}`}>
                                Enter Campaign
                            </a>
                            <a
                                href={registerUrl}
                                className={`campaign-nav-link campaign-nav-link--cta${isRegisterPage ? ' active' : ''}`}
                            >
                                Join
                            </a>
                        </>
                    )}
                </nav>
            )}

            <div
                className={`campaign-nav-drawer${open ? ' open' : ''}`}
                id="campaign-nav-drawer"
                aria-hidden={!open}
            >
                <div className="campaign-nav-backdrop" onClick={onClose} role="presentation" />
                <div className="campaign-nav-panel" role="dialog" aria-modal="true" aria-label="Campaign menu">
                    <div className="campaign-nav-panel-head">
                        <span className="campaign-nav-panel-title">Explore</span>
                        <button type="button" className="campaign-nav-close" onClick={onClose} aria-label="Close menu">
                            ×
                        </button>
                    </div>
                    <div className="campaign-nav-panel-links">
                        <Link
                            href="/campaign"
                            className={`campaign-nav-drawer-link${pathname === '/campaign' ? ' active' : ''}`}
                            onClick={onClose}
                        >
                            Campaign
                        </Link>
                        <Link
                            href="/"
                            className={`campaign-nav-drawer-link${pathname === '/' ? ' active' : ''}`}
                            onClick={onClose}
                        >
                            Site home
                        </Link>
                        {!isGuest && (
                            <Link
                                href="/dashboard"
                                className={`campaign-nav-drawer-link${pathname === '/dashboard' ? ' active' : ''}`}
                                onClick={onClose}
                            >
                                Dashboard
                            </Link>
                        )}
                        {!isGuest && auth?.user?.staff_active && (
                            <Link
                                href="/staff"
                                className={`campaign-nav-drawer-link${pathname === '/staff' ? ' active' : ''}`}
                                onClick={onClose}
                            >
                                Staff
                            </Link>
                        )}
                        {CAMPAIGN_NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`campaign-nav-drawer-link${pathname === link.href ? ' active' : ''}`}
                                onClick={onClose}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {guestLinks}
                    </div>
                </div>
            </div>
        </>
    );
}
