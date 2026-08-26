import { Link } from '@inertiajs/react';
import LandingChrome, { LandingStoryCtas } from '../../Components/Fan/LandingChrome';

function StoryCopy({ body, bodies }) {
    const paragraphs = bodies?.length ? bodies : body ? [body] : [];

    if (paragraphs.length === 0) {
        return null;
    }

    return (
        <div className="mf-land__story-copy">
            {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
        </div>
    );
}

/**
 * @param {{
 *   title: string,
 *   eyebrow?: string,
 *   description?: string,
 *   slug?: string,
 *   sections?: Array<{
 *     eyebrow?: string,
 *     title: string,
 *     body?: string,
 *     bodies?: string[],
 *     bullets?: string[],
 *     cards?: Array<{ label: string, title: string, body: string }>,
 *   }>,
 * }} props
 */
export default function StaticPage({
    title,
    eyebrow = 'Mad Fan',
    description,
    slug,
    sections = [],
}) {
    const activeHref = slug ? `/${slug}` : undefined;

    return (
        <LandingChrome title={title} activeHref={activeHref}>
            <header className="mf-land__page-hero">
                <div className="mf-land__page-hero-inner">
                    <p className="mf-land__eyebrow">{eyebrow}</p>
                    <h1>{title}</h1>
                    {description ? <p className="mf-land__page-lead">{description}</p> : null}
                </div>
            </header>

            {sections.map((section, index) => {
                const mist = index % 2 === 1;
                const cardCols =
                    section.cards?.length >= 5
                        ? 'mf-land__card-grid--5'
                        : section.cards?.length === 4
                          ? 'mf-land__card-grid--4'
                          : 'mf-land__card-grid--3';

                return (
                    <section
                        key={section.title}
                        className={`mf-land__band${mist ? ' mf-land__band--mist' : ''}`}
                        aria-labelledby={`story-${index}`}
                    >
                        <div className="mf-land__section-head">
                            <div className="mf-land__section-copy">
                                {section.eyebrow ? (
                                    <p className="mf-land__eyebrow">{section.eyebrow}</p>
                                ) : null}
                                <h2 id={`story-${index}`}>{section.title}</h2>
                                <StoryCopy body={section.body} bodies={section.bodies} />
                            </div>
                        </div>

                        {section.bullets?.length ? (
                            <ul className="mf-land__story-bullets">
                                {section.bullets.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        ) : null}

                        {section.cards?.length ? (
                            <div className={`mf-land__card-grid ${cardCols}`}>
                                {section.cards.map((card) => (
                                    <article key={card.title} className="mf-land__info-card">
                                        <p className="mf-land__info-label">{card.label}</p>
                                        <h3>{card.title}</h3>
                                        <p>{card.body}</p>
                                    </article>
                                ))}
                            </div>
                        ) : null}
                    </section>
                );
            })}

            <section className="mf-land__band mf-land__band--mist" aria-label="Continue">
                <div className="mf-land__section-head">
                    <div className="mf-land__section-copy">
                        <p className="mf-land__eyebrow">Season 01</p>
                        <h2>Ready to earn your standing?</h2>
                        <p>Return home or enter the campaign and start building your passport.</p>
                    </div>
                    <LandingStoryCtas />
                </div>
                <div className="mf-land__page-grid">
                    <Link href="/community" className="mf-land__page-card">
                        <p className="mf-land__info-label">Ecosystem</p>
                        <h3>Community</h3>
                        <p>Your club's terrace and chat rooms.</p>
                        <span>Open</span>
                    </Link>
                    <Link href="/rewards" className="mf-land__page-card">
                        <p className="mf-land__info-label">Ecosystem</p>
                        <h3>Rewards</h3>
                        <p>How participation becomes loyalty.</p>
                        <span>Open</span>
                    </Link>
                    <Link href="/about" className="mf-land__page-card">
                        <p className="mf-land__info-label">Company</p>
                        <h3>About</h3>
                        <p>Vision, thesis, and the loyalty layer.</p>
                        <span>Open</span>
                    </Link>
                    <Link href="/roadmap" className="mf-land__page-card">
                        <p className="mf-land__info-label">Company</p>
                        <h3>Roadmap</h3>
                        <p>Proof before scale, season by season.</p>
                        <span>Open</span>
                    </Link>
                    <Link href="/region" className="mf-land__page-card">
                        <p className="mf-land__info-label">Company</p>
                        <h3>Region</h3>
                        <p>Football first hubs, portable identity.</p>
                        <span>Open</span>
                    </Link>
                    <Link href="/team" className="mf-land__page-card">
                        <p className="mf-land__info-label">Company</p>
                        <h3>Team</h3>
                        <p>The people shipping Mad Fan.</p>
                        <span>Open</span>
                    </Link>
                </div>
            </section>
        </LandingChrome>
    );
}
