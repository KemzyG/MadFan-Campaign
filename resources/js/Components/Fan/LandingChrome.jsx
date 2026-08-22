import { Head, Link, usePage } from '@inertiajs/react';
import { resolveSocialHref as resolveHref, socialPath } from '../../lib/socialPath';
import FanBrandLogo from './FanBrandLogo';

export const LANDING_NAV = [
    { href: '/campaign', label: 'Campaign' },
    { href: '/social', label: 'Social' },
    { href: '/social/shop', label: 'Store' },
    { href: '/about', label: 'About' },
    { href: '/roadmap', label: 'Roadmap' },
    { href: '/team', label: 'Team' },
];

export const LANDING_FOOTER = [
    {
        title: 'Product',
        links: [
            { href: '/campaign', label: 'Campaign' },
            { href: '/social', label: 'Social' },
            { href: '/social/shop', label: 'Store' },
            { href: '/social/fixtures', label: 'Fixtures' },
        ],
    },
    {
        title: 'Company',
        links: [
            { href: '/about', label: 'About' },
            { href: '/roadmap', label: 'Roadmap' },
            { href: '/team', label: 'Team' },
            { href: '/region', label: 'Region' },
        ],
    },
    {
        title: 'Help',
        links: [
            { href: '/login', label: 'Sign in' },
            { href: '/register', label: 'Create account' },
            { href: '/campaign', label: 'Season guide' },
        ],
    },
    {
        title: 'Community',
        links: [
            { href: '/social', label: 'Global feed' },
            { href: '/social/stage', label: 'Live stage' },
            { href: '/social/tickets', label: 'Match tickets' },
        ],
    },
];

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path strokeLinecap="round" d="m16 16 3.5 3.5" />
        </svg>
    );
}

function BagIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.5 9.5 8 5.5h8l1.5 4M5.5 9.5h13v8.2A1.8 1.8 0 0 1 16.7 19.5H7.3A1.8 1.8 0 0 1 5.5 17.7V9.5Z"
            />
        </svg>
    );
}

function HeartIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19s-6.5-4.1-6.5-8.2A3.7 3.7 0 0 1 12 8.1a3.7 3.7 0 0 1 6.5 2.7C18.5 14.9 12 19 12 19Z"
            />
        </svg>
    );
}

export function LandingUtil() {
    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <div className="mf-land__util">
            <Link href="/about">Help</Link>
            {user ? (
                <Link href="/dashboard">Dashboard</Link>
            ) : (
                // Plain anchor: /login renders in the dark Social shell, which
                // needs a full navigation to load its bundle/styles.
                <a href="/login">Sign in</a>
            )}
            <a href="/register">Join</a>
        </div>
    );
}

/**
 * @param {{ activeHref?: string }} props
 */
export function LandingNav({ activeHref }) {
    const page = usePage();

    return (
        <header className="mf-land__nav">
            <Link href="/" className="mf-land__brand" aria-label="Mad Fan home">
                <FanBrandLogo asLink={false} size={28} className="" />
                <span>Mad Fan</span>
            </Link>

            <nav className="mf-land__links" aria-label="Primary">
                {LANDING_NAV.map((link) => (
                    <Link
                        key={link.href}
                        href={resolveHref(link.href, page.props)}
                        className={activeHref === link.href ? 'is-active' : undefined}
                        aria-current={activeHref === link.href ? 'page' : undefined}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>

            <div className="mf-land__tools">
                <span className="mf-land__search" aria-hidden>
                    <SearchIcon />
                    Search
                </span>
                <Link href={socialPath(page.props)} className="mf-land__icon" aria-label="Social">
                    <HeartIcon />
                </Link>
                <Link href={socialPath(page.props, '/shop')} className="mf-land__icon" aria-label="Store">
                    <BagIcon />
                </Link>
            </div>
        </header>
    );
}

export function LandingFooter() {
    const page = usePage();

    return (
        <footer className="mf-land__footer">
            <div className="mf-land__footer-inner">
                <div className="mf-land__footer-top">
                    <p>Mad Fan</p>
                    <span>Football loyalty · Global</span>
                </div>
                <div className="mf-land__footer-grid">
                    {LANDING_FOOTER.map((column) => (
                        <div key={column.title} className="mf-land__footer-col">
                            <h3>{column.title}</h3>
                            <ul>
                                {column.links.map((link) => (
                                    <li key={link.href + link.label}>
                                        <Link href={resolveHref(link.href, page.props)}>{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <p className="mf-land__legal">
                    © {new Date().getFullYear()} Mad Fan. Belonging, contribution, and loyalty as identity.
                </p>
            </div>
        </footer>
    );
}

/**
 * Shared monochrome landing shell for company/story surfaces.
 *
 * @param {{
 *   title: string,
 *   activeHref?: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export default function LandingChrome({ title, activeHref, children }) {
    return (
        <div className="mf-land">
            <Head title={title}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Oswald:wght@500&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <LandingUtil />
            <LandingNav activeHref={activeHref} />
            {children}
            <LandingFooter />
        </div>
    );
}

/**
 * Consistent story-page CTA row.
 */
export function LandingStoryCtas() {
    return (
        <div className="mf-land__hero-actions mf-land__story-ctas">
            <Link href="/" className="mf-land__pill mf-land__pill--outline">
                ← Back to Mad Fan
            </Link>
            <Link href="/campaign" className="mf-land__pill mf-land__pill--dark">
                Enter Season 01
            </Link>
        </div>
    );
}
