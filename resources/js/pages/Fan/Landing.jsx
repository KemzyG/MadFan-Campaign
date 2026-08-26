import { Head, Link, usePage } from '@inertiajs/react';
import {
    LandingFooter,
    LandingNav,
    LandingUtil,
} from '../../Components/Fan/LandingChrome';
import { LandingReveal } from '../../Components/Fan/useLandingReveal';
import { resolveSocialHref, socialPath } from '../../lib/socialPath';

const CATEGORIES = [
    {
        key: 'passport',
        label: 'Fan identity',
        title: 'Wear your loyalty',
        href: '/social/passport',
        cta: 'Build your passport',
    },
    {
        key: 'social',
        label: 'Fan community',
        title: 'Terrace, chat, matchday',
        href: '/community',
        cta: 'Explore the community',
    },
    {
        key: 'campaign',
        label: 'Season 01',
        title: 'Earn your standing',
        href: '/campaign',
        cta: 'Enter campaign',
    },
    {
        key: 'shop',
        label: 'Kit room',
        title: 'Jerseys as matchday art',
        href: '/social/shop',
        cta: 'Browse store',
    },
];

const EMPTY_STORY = {
    thesis: {
        eyebrow: 'Why Mad Fan',
        title: 'Your loyalty was never the problem. The scoreboard was.',
        body: 'Mad Fan makes loyalty visible, verifiable, and valuable.',
    },
    pages: [],
};

function SectionHead({ eyebrow, title, body, action }) {
    return (
        <div className="mf-land__section-head">
            <div className="mf-land__section-copy">
                {eyebrow ? <p className="mf-land__eyebrow">{eyebrow}</p> : null}
                <h2>{title}</h2>
                {body ? <p>{body}</p> : null}
            </div>
            {action}
        </div>
    );
}

export default function Landing({
    images = {},
    featured = [],
    stats = {},
    story = EMPTY_STORY,
}) {
    const { props: pageProps } = usePage();
    const categoryImages = images?.categories || {};
    const heroPhones = Array.isArray(images?.phones) ? images.phones : [];
    const products = featured.length > 0 ? featured.slice(0, 6) : [];
    const thesis = story.thesis || EMPTY_STORY.thesis;
    const waitlist = Number(stats.waitlist_count || 0).toLocaleString();

    return (
        <div className="mf-land">
            <Head title="Mad Fan — Your place as a fan">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Oswald:wght@500&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <LandingUtil />
            <LandingNav />

            <section className="mf-land__hero" aria-label="Hero">
                <div className="mf-land__hero-fallback" aria-hidden />
                <div className="mf-land__hero-scrim" aria-hidden />
                {heroPhones.length > 0 ? (
                    <div className="mf-land__hero-phones" aria-label="Mad Fan Social on mobile">
                        {heroPhones.map((phone) => (
                            <img
                                key={phone.key || phone.stack}
                                className={`mf-land__hero-phone mf-land__hero-phone--${phone.stack || 'center'}`}
                                src={phone.url}
                                alt={phone.alt || 'Mad Fan Social on mobile'}
                                width={360}
                                height={720}
                                decoding="async"
                            />
                        ))}
                    </div>
                ) : null}
                <div className="mf-land__hero-copy">
                    <p className="mf-land__hero-brand">Mad Fan</p>
                    <h1 className="mf-land__hero-title">This is your place as a fan</h1>
                    <p className="mf-land__hero-lead">
                        Pick your club, post on the terrace, talk in your club's room, and watch your
                        loyalty become who you are — verified on your Fan Passport.
                    </p>
                    <div className="mf-land__hero-actions">
                        <Link href="/campaign" className="mf-land__pill mf-land__pill--light">
                            Enter campaign
                        </Link>
                        <Link href="/community" className="mf-land__pill mf-land__pill--ghost">
                            Explore the community
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mf-land__stats" aria-label="Season pulse">
                <LandingReveal className="mf-land__stats-inner" stagger>
                    <div>
                        <strong>{waitlist}</strong>
                        <span>Fans on waitlist</span>
                    </div>
                    <div>
                        <strong>{stats.season_weeks ?? 8}</strong>
                        <span>Weeks in Season 01</span>
                    </div>
                    <div>
                        <strong>{stats.points_pool ?? '500K'}</strong>
                        <span>Points up for grabs</span>
                    </div>
                </LandingReveal>
            </section>

            <section className="mf-land__categories" aria-label="Explore Mad Fan">
                {CATEGORIES.map((item) => {
                    const image = categoryImages[item.key];

                    return (
                        <LandingReveal key={item.key} as="article" className="mf-land__cat">
                            {image?.url ? (
                                <img
                                    className="mf-land__cat-photo"
                                    src={image.url}
                                    alt={image.alt || item.title}
                                />
                            ) : (
                                <div className="mf-land__cat-fallback" aria-hidden />
                            )}
                            <div className="mf-land__cat-scrim" aria-hidden />
                            <div className="mf-land__cat-body">
                                <p className="mf-land__cat-label">{item.label}</p>
                                <h2 className="mf-land__cat-title">{item.title}</h2>
                                <Link
                                    href={resolveSocialHref(item.href, pageProps)}
                                    className="mf-land__pill mf-land__pill--light"
                                >
                                    {item.cta}
                                </Link>
                            </div>
                        </LandingReveal>
                    );
                })}
            </section>

            <section className="mf-land__band" aria-label="Why Mad Fan">
                <LandingReveal>
                    <SectionHead
                        eyebrow={thesis.eyebrow}
                        title={thesis.title}
                        body={thesis.body}
                        action={
                            <Link href="/about" className="mf-land__text-link">
                                Read the full thesis
                            </Link>
                        }
                    />
                </LandingReveal>
            </section>

            <section className="mf-land__band mf-land__band--mist" aria-label="Season 01">
                <LandingReveal>
                    <SectionHead
                        eyebrow="Season 01"
                        title="8 weeks. One board. Your name on it."
                        body="Daily claims, referrals, and weekly tasks all feed the same passport ledger. Full mechanics, points, and THE BOARD live on the campaign page."
                        action={
                            <Link href="/campaign" className="mf-land__pill mf-land__pill--dark">
                                Explore campaigns
                            </Link>
                        }
                    />
                </LandingReveal>
            </section>

            <section className="mf-land__band" aria-label="Roadmap">
                <LandingReveal>
                    <SectionHead
                        eyebrow="Roadmap"
                        title="Proof before scale"
                        body="Season 01 first. Then identity that persists across seasons. Then the marketplace and index that make loyalty portable everywhere."
                        action={
                            <Link href="/roadmap" className="mf-land__text-link">
                                See the full roadmap
                            </Link>
                        }
                    />
                </LandingReveal>
            </section>

            {story.pages?.length > 0 ? (
                <section className="mf-land__band mf-land__band--mist" aria-label="Go deeper into Mad Fan">
                    <LandingReveal>
                        <SectionHead
                            eyebrow="Go deeper"
                            title="More from Mad Fan"
                            body="Vision, rewards, and the roadmap ahead — for fans, partners, and the just-curious."
                        />
                    </LandingReveal>
                    <LandingReveal className="mf-land__page-grid" stagger>
                        {story.pages.map((page) => (
                            <Link key={page.href} href={page.href} className="mf-land__page-card">
                                <p className="mf-land__info-label">{page.label}</p>
                                <h3>{page.title}</h3>
                                <p>{page.body}</p>
                                <span>Open</span>
                            </Link>
                        ))}
                    </LandingReveal>
                </section>
            ) : null}

            <section className="mf-land__shelf" aria-label="Featured kits">
                <LandingReveal className="mf-land__shelf-head">
                    <h2>Featured kits</h2>
                    <Link href={socialPath(pageProps, '/shop')}>Store all</Link>
                </LandingReveal>
                {products.length === 0 ? (
                    <LandingReveal as="p" className="mf-land__shelf-empty">
                        Kit drops land here once the store is stocked.
                    </LandingReveal>
                ) : (
                    <LandingReveal className="mf-land__products" stagger>
                        {products.map((item) => {
                            const href = socialPath(pageProps, item.slug ? `/shop/${item.slug}` : '/shop');

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
                    </LandingReveal>
                )}
            </section>

            <section className="mf-land__cta" aria-label="Join">
                <LandingReveal className="mf-land__cta-inner">
                    <p className="mf-land__eyebrow mf-land__live">Season 01 is live</p>
                    <h2>Claim your spot. Build your passport.</h2>
                    <p>
                        Join the waitlist campaign, create your Fan Passport, and start earning on the terrace.
                    </p>
                    <div className="mf-land__hero-actions">
                        <Link href="/campaign" className="mf-land__pill mf-land__pill--light">
                            Enter campaign
                        </Link>
                        {/* Plain anchor: /register renders in the dark Social shell,
                            which needs a full navigation to load its bundle/styles. */}
                        <a href="/register" className="mf-land__pill mf-land__pill--ghost">
                            Create account
                        </a>
                    </div>
                </LandingReveal>
            </section>

            <LandingFooter />
        </div>
    );
}
