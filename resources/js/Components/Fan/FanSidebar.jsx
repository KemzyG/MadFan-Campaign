import { Link, usePage } from '@inertiajs/react';

function isActive(url, href) {
    if (href === '/') {
        return url === '/';
    }

    return url === href || url.startsWith(`${href}?`) || url.startsWith(href);
}

export default function FanSidebar({
    open,
    onClose,
    isAuthenticated = false,
    onOpenOnboarding,
    registerUrl = '/register',
    fanId = null,
    socialVerificationRequired = true,
    showStaffNav = false,
}) {
    const { url } = usePage();

    const linkClass = (href) => {
        const base = 'campaign-sidebar-link';

        return isActive(url, href) ? `${base} active` : base;
    };

    return (
        <>
            <div className={`campaign-sidebar-backdrop${open ? ' open' : ''}`} onClick={onClose} role="presentation" />

            <aside
                className={`campaign-sidebar${open ? ' open' : ''}`}
                aria-label="Fan app navigation"
                aria-hidden={!open}
            >
                <div className="campaign-sidebar-head">
                    <div className="campaign-sidebar-head-main">
                        <div className="campaign-sidebar-eye">Your Squad</div>
                        <div className="campaign-sidebar-title">NAVIGATE</div>
                        {fanId && <div className="campaign-sidebar-fan-id">{fanId}</div>}
                    </div>
                    <button type="button" className="campaign-sidebar-close" onClick={onClose} aria-label="Close menu">
                        ×
                    </button>
                </div>

                <nav className="campaign-sidebar-nav">
                    {isAuthenticated ? (
                        <>
                            <Link href="/" className={linkClass('/')} onClick={onClose}>
                                Campaign Home
                            </Link>
                            <Link href="/dashboard" className={linkClass('/dashboard')} onClick={onClose}>
                                Dashboard
                            </Link>
                            <Link href="/daily-claim" className={linkClass('/daily-claim')} onClick={onClose}>
                                Daily Claim
                            </Link>
                            {showStaffNav && (
                                <Link href="/staff" className={linkClass('/staff')} onClick={onClose}>
                                    Staff Dashboard
                                </Link>
                            )}
                            <Link href="/tasks" className={linkClass('/tasks')} onClick={onClose}>
                                Tasks
                            </Link>
                            <Link href="/connect-accounts?manage=1" className={linkClass('/connect-accounts')} onClick={onClose}>
                                Connected Accounts
                            </Link>
                            <Link href="/passport" className={linkClass('/passport')} onClick={onClose}>
                                Fan Passport
                            </Link>
                            <Link href="/logout" method="post" as="button" className="campaign-sidebar-link" onClick={onClose}>
                                Sign Out
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/" className={linkClass('/')} onClick={onClose}>
                                Campaign Home
                            </Link>
                            {socialVerificationRequired && (
                                <>
                                    <button
                                        type="button"
                                        className="campaign-sidebar-link primary"
                                        onClick={() => {
                                            onOpenOnboarding();
                                            onClose();
                                        }}
                                    >
                                        Complete Registration
                                    </button>
                                    <Link href="/?onboarding=1" className="campaign-sidebar-link" onClick={onClose}>
                                        Starter Tasks
                                    </Link>
                                </>
                            )}
                            <Link href={registerUrl} className={linkClass('/register')} onClick={onClose}>
                                Create Fan Account
                            </Link>
                            <Link href="/login" className={linkClass('/login')} onClick={onClose}>
                                Enter Campaign
                            </Link>
                        </>
                    )}
                </nav>
            </aside>
        </>
    );
}
