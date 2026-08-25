import { Link } from '@inertiajs/react';

function IconWallet() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="3.2" y="6" width="17.6" height="13" rx="2.4" strokeWidth="1.65" />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
                d="M3.6 8.5 16 8.5M16.5 12.5h4.3v3.5h-4.3a1.75 1.75 0 0 1 0-3.5Z"
            />
        </svg>
    );
}

function IconPassport() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth="1.75" />
            <circle cx="12" cy="10" r="2.5" />
            <path strokeLinecap="round" d="M8 16.5c1.2-1.4 2.5-2 4-2s2.8.6 4 2" />
        </svg>
    );
}

function IconLeaderboard() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" d="M8 21h8M12 17v4M7 4h10v4.5a5 5 0 0 1-10 0V4Z" />
            <path strokeLinecap="round" strokeWidth="1.55" d="M7 6H4.5v1.5A2.5 2.5 0 0 0 7 10M17 6h2.5v1.5A2.5 2.5 0 0 1 17 10" />
        </svg>
    );
}

function IconClub() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 19V5.8L12 4l8 1.8V19l-8-1.8L4 19Z" />
            <path strokeLinecap="round" strokeWidth="1.75" d="M12 4v13.2" />
        </svg>
    );
}

const LINKS = [
    { href: '/social/wallet', label: 'Wallet', hint: 'Balance & activity', icon: IconWallet },
    { href: '/social/passport', label: 'Passport', hint: 'Your fan card', icon: IconPassport },
    { href: '/social/leaderboard', label: 'Leaderboard', hint: 'Terrace rankings', icon: IconLeaderboard },
    { href: '/social/onboarding/club', label: 'Change club', hint: 'Switch allegiance', icon: IconClub },
];

/**
 * Destinations that used to live in the sidebar nav — wallet, passport,
 * leaderboard — now surfaced as quick-access cards from the self profile page.
 */
export default function YouQuickLinks() {
    return (
        <nav className="mf-you-links" aria-label="Your destinations">
            {LINKS.map(({ href, label, hint, icon: Icon }) => (
                <Link key={href} href={href} className="mf-you-link" prefetch>
                    <span className="mf-you-link__icon" aria-hidden>
                        <Icon />
                    </span>
                    <span className="mf-you-link__copy">
                        <span className="mf-you-link__label">{label}</span>
                        <span className="mf-text-caption mf-you-link__hint">{hint}</span>
                    </span>
                    <span className="mf-you-link__chevron" aria-hidden>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="m9 6 6 6-6 6" />
                        </svg>
                    </span>
                </Link>
            ))}
        </nav>
    );
}
