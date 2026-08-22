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
        key: 'campaign',
        label: 'Season campaign',
        title: 'Earn loyalty for your club',
        href: '/campaign',
        cta: 'Enter campaign',
    },
    {
        key: 'social',
        label: 'Terrace social',
        title: 'Feed, chat, fixtures',
        href: '/social',
        cta: 'Open terrace',
    },
    {
        key: 'shop',
        label: 'Kit room',
        title: 'Jerseys as matchday art',
        href: '/social/shop',
        cta: 'Browse store',
    },
    {
        key: 'passport',
        label: 'Fan passport',
        title: 'Your score is identity',
        href: '/social/passport',
        cta: 'View passport',
    },
];

const EMPTY_STORY = {
    thesis: {
        eyebrow: 'Why Mad Fan',
        title: 'Loyalty deserves infrastructure',
        body: 'Mad Fan makes loyalty visible, verifiable, and valuable.',
    },
    primitives: [],
    earn: [],
    weeks: [],
    roadmap: [],
    regions: [],
    team: [],
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
            <Head title="Mad Fan — The loyalty layer of football">
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
                    <h1 className="mf-land__hero-title">Loyalty that counts</h1>
                    <p className="mf-land__hero-lead">
                        The loyalty layer of the football internet. Pick your club, earn on Season 01,
                        engage on the terrace, and wear your standing on a passport.
                    </p>
                    <div className="mf-land__hero-actions">
                        <Link href="/campaign" className="mf-land__pill mf-land__pill--light">
                            Enter campaign
                        </Link>
                        <Link href="/about" className="mf-land__pill mf-land__pill--ghost">
                            About Mad Fan
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
                                Read about us
                            </Link>
                        }
                    />
                </LandingReveal>
                {story.primitives?.length > 0 ? (
                    <LandingReveal className="mf-land__card-grid mf-land__card-grid--5" stagger>
                        {story.primitives.map((item) => (
                            <article key={item.title} className="mf-land__info-card">
                                <p className="mf-land__info-label">{item.label}</p>
                                <h3>{item.title}</h3>
                                <p>{item.body}</p>
                            </article>
                        ))}
                    </LandingReveal>
                ) : null}
            </section>

            <section className="mf-land__band mf-land__band--mist" aria-label="Season 01">
                <LandingReveal>
                    <SectionHead
                        eyebrow="Season 01"
                        title="8 weeks. Earn your standing."
                        body="Daily claims, referrals, tasks, and streaks feed one passport ledger. Climb THE BOARD for early access and founding status."
                        action={
                            <Link href="/campaign" className="mf-land__pill mf-land__pill--dark">
                                Open campaign
                            </Link>
                        }
                    />
                </LandingReveal>
                {story.earn?.length > 0 ? (
                    <LandingReveal className="mf-land__card-grid mf-land__card-grid--4" stagger>
                        {story.earn.map((item) => (
                            <article key={item.name} className="mf-land__info-card">
                                <p className="mf-land__info-label">{item.pts}</p>
                                <h3>{item.name}</h3>
                                <p>{item.desc}</p>
                            </article>
                        ))}
                    </LandingReveal>
                ) : null}
                {story.weeks?.length > 0 ? (
                    <LandingReveal className="mf-land__week-grid" stagger aria-label="Season chapters">
                        {story.weeks.map((week) => (
                            <article key={week.num} className="mf-land__week">
                                <p className="mf-land__info-label">{week.num}</p>
                                <h3>{week.name}</h3>
                                <p>{week.desc}</p>
                            </article>
                        ))}
                    </LandingReveal>
                ) : null}
            </section>

            <section className="mf-land__band" aria-label="Roadmap">
                <LandingReveal>
                    <SectionHead
                        eyebrow="Roadmap"
                        title="Proof before scale"
                        body="Ship trust with live fans first, harden identity next, then unlock markets that compound for years."
                        action={
                            <Link href="/roadmap" className="mf-land__text-link">
                                Full roadmap
                            </Link>
                        }
                    />
                </LandingReveal>
                {story.roadmap?.length > 0 ? (
                    <LandingReveal className="mf-land__card-grid mf-land__card-grid--3" stagger>
                        {story.roadmap.map((item) => (
                            <article key={item.title} className="mf-land__info-card">
                                <p className="mf-land__info-label">{item.label}</p>
                                <h3>{item.title}</h3>
                                <p>{item.body}</p>
                            </article>
                        ))}
                    </LandingReveal>
                ) : null}
            </section>

            <section className="mf-land__band mf-land__band--mist" aria-label="Region">
                <LandingReveal>
                    <SectionHead
                        eyebrow="Region"
                        title="Football first, global next"
                        body="Root where passion is lifelong, then grow hubs that feed one portable Loyalty Layer."
                        action={
                            <Link href="/region" className="mf-land__text-link">
                                Explore regions
                            </Link>
                        }
                    />
                </LandingReveal>
                {story.regions?.length > 0 ? (
                    <LandingReveal className="mf-land__card-grid mf-land__card-grid--3" stagger>
                        {story.regions.map((item) => (
                            <article key={item.title} className="mf-land__info-card">
                                <p className="mf-land__info-label">{item.label}</p>
                                <h3>{item.title}</h3>
                                <p>{item.body}</p>
                            </article>
                        ))}
                    </LandingReveal>
                ) : null}
            </section>

            {story.pages?.length > 0 ? (
                <section className="mf-land__band mf-land__band--mist" aria-label="Company pages">
                    <LandingReveal>
                        <SectionHead
                            eyebrow="Company"
                            title="Go deeper"
                            body="Full narrative pages for vision, roadmap, regions, and the people building Mad Fan."
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
                    <p className="mf-land__eyebrow">Season 01 is live</p>
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
