import { Head, Link, usePage } from '@inertiajs/react';
import FanBrandLogo from '../../Components/Fan/FanBrandLogo';

const CATEGORY_COPY = [
    {
        key: 'campaign',
        label: 'Season campaign',
        title: 'Earn loyalty for your club',
        href: '/campaign',
        cta: 'Enter campaign',
        body: 'Daily claims, tasks, and referrals — one ledger into your passport.',
    },
    {
        key: 'social',
        label: 'Terrace social',
        title: 'Feed, chat, fixtures',
        href: '/social',
        cta: 'Open terrace',
        body: 'Club-first posts, hangouts, and match boards that feel like matchday.',
    },
    {
        key: 'shop',
        label: 'Kit room',
        title: 'Jerseys as loyalty merch',
        href: '/social/shop',
        cta: 'Browse kits',
        body: 'Wear the allegiance — product photography, not chrome.',
    },
    {
        key: 'passport',
        label: 'Fan passport',
        title: 'Your score is your identity',
        href: '/social/passport',
        cta: 'View passport',
        body: 'Points, streak, club crest, and the full activity ledger in one place.',
    },
];

const FOOTER = [
    {
        title: 'Product',
        links: [
            { href: '/campaign', label: 'Campaign' },
            { href: '/social', label: 'Social' },
            { href: '/social/shop', label: 'Shop' },
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 9.5 8 5.5h8l1.5 4M5.5 9.5h13v8.2A1.8 1.8 0 0 1 16.7 19.5H7.3A1.8 1.8 0 0 1 5.5 17.7V9.5Z" />
        </svg>
    );
}

function HeartIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19s-6.5-4.1-6.5-8.2A3.7 3.7 0 0 1 12 8.1a3.7 3.7 0 0 1 6.5 2.7C18.5 14.9 12 19 12 19Z" />
        </svg>
    );
}

export default function Landing({ images = {}, featured = [] }) {
    const { auth, app } = usePage().props;
    const user = auth?.user;
    const hero = images?.hero;
    const categoryImages = images?.categories || {};
    const products = featured.length > 0 ? featured.slice(0, 6) : [];

    return (
        <div className="mf-land">
            <Head title="Mad Fan — The loyalty layer of football" />

            <div className="mf-land__util">
                <Link href="/about">Help</Link>
                {user ? (
                    <Link href="/dashboard">Dashboard</Link>
                ) : (
                    <Link href="/login">Sign in</Link>
                )}
                <Link href="/campaign">Campaign</Link>
            </div>

            <header className="mf-land__nav">
                <Link href="/" className="mf-land__brand" aria-label="Mad Fan home">
                    <FanBrandLogo asLink={false} size={32} className="" />
                    <span>Mad Fan</span>
                </Link>

                <nav className="mf-land__links" aria-label="Primary">
                    <Link href="/campaign">Campaign</Link>
                    <Link href="/social">Social</Link>
                    <Link href="/social/shop">Shop</Link>
                    <Link href="/social/fixtures">Fixtures</Link>
                    <Link href="/about">About</Link>
                    <Link href="/roadmap">Roadmap</Link>
                </nav>

                <div className="mf-land__tools">
                    <span className="mf-land__search" aria-hidden>
                        <SearchIcon />
                        Search
                    </span>
                    <Link href="/social" className="mf-land__icon" aria-label="Social">
                        <HeartIcon />
                    </Link>
                    <Link href="/social/shop" className="mf-land__icon" aria-label="Shop">
                        <BagIcon />
                    </Link>
                </div>
            </header>

            <section className="mf-land__hero" aria-label="Hero">
                {hero?.url ? (
                    <img
                        className="mf-land__hero-photo"
                        src={hero.url}
                        alt={hero.alt || 'Mad Fan'}
                    />
                ) : (
                    <div className="mf-land__hero-visual" aria-hidden />
                )}
                <div className="mf-land__hero-copy">
                    <p className="mf-land__hero-brand">{app?.name || 'Mad Fan'}</p>
                    <h1 className="mf-land__hero-title">Loyalty that counts</h1>
                    <p className="mf-land__hero-lead">
                        The loyalty layer of the football internet. Pick your club, engage on the terrace,
                        earn on the campaign, and wear your standing on a passport — one score, one identity.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                        <Link href="/campaign" className="mf-land__pill mf-land__pill--light">
                            Enter campaign
                        </Link>
                        <Link href="/social" className="mf-land__pill mf-land__pill--light">
                            Join the terrace
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mf-land__categories" aria-label="Explore Mad Fan">
                {CATEGORY_COPY.map((item) => {
                    const image = categoryImages[item.key];

                    return (
                        <article key={item.key} className="mf-land__cat">
                            {image?.url ? (
                                <img
                                    className="mf-land__cat-photo"
                                    src={image.url}
                                    alt={image.alt || item.title}
                                />
                            ) : (
                                <div className="mf-land__cat-media mf-land__cat-media--fallback" aria-hidden />
                            )}
                            <div className="mf-land__cat-scrim" aria-hidden />
                            <div className="mf-land__cat-body">
                                <p className="mf-land__cat-label">{item.label}</p>
                                <h2 className="mf-land__cat-title">{item.title}</h2>
                                <p className="mf-land__cat-lead">{item.body}</p>
                                <div className="mf-land__cat-actions">
                                    <Link href={item.href} className="mf-land__pill mf-land__pill--light">
                                        {item.cta}
                                    </Link>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </section>

            <section className="mf-land__shelf" aria-label="Featured kits">
                <div className="mf-land__shelf-head">
                    <h2>Featured kits</h2>
                    <Link href="/social/shop">Shop all</Link>
                </div>
                {products.length === 0 ? (
                    <p className="mf-land__shelf-empty">Kit drops land here once the shop is stocked.</p>
                ) : (
                    <div className="mf-land__products">
                        {products.map((item) => {
                            const href = item.slug ? `/social/shop/${item.slug}` : '/social/shop';

                            return (
                                <Link key={item.id} href={href} className="mf-land__product">
                                    <div
                                        className={`mf-land__product-frame${item.image_url ? '' : ' mf-land__product-frame--empty'}`}
                                    >
                                        {item.image_url ? (
                                            <img src={item.image_url} alt="" loading="lazy" />
                                        ) : null}
                                        <span className="mf-land__product-tag">{item.name}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            <footer className="mf-land__footer">
                <div className="mf-land__footer-inner">
                    <div className="mf-land__footer-top">
                        <p>Mad Fan</p>
                        <span>Football loyalty · Global</span>
                    </div>
                    <div className="mf-land__footer-grid">
                        {FOOTER.map((column) => (
                            <div key={column.title} className="mf-land__footer-col">
                                <h3>{column.title}</h3>
                                <ul>
                                    {column.links.map((link) => (
                                        <li key={link.href + link.label}>
                                            <Link href={link.href}>{link.label}</Link>
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
        </div>
    );
}
