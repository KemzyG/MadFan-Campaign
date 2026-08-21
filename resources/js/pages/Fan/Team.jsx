import { Link } from '@inertiajs/react';
import LandingChrome from '../../Components/Fan/LandingChrome';
import { teamPhotoUrl } from '../../Components/Fan/teamPhotos';

/**
 * @param {{
 *   title: string,
 *   eyebrow?: string,
 *   description?: string,
 *   intro?: Array<{ eyebrow?: string, title: string, bodies?: string[], bullets?: string[] }>,
 *   members?: Array<{
 *     name: string,
 *     role: string,
 *     location?: string | null,
 *     photo?: string | null,
 *     bio: string,
 *     focus?: string[],
 *     social?: { label: string, url: string } | null,
 *   }>,
 *   culture?: { title: string, bodies?: string[], bullets?: string[] },
 *   open_roles?: Array<{ title: string, type: string, summary: string }>,
 *   contact_email?: string,
 * }} props
 */
export default function Team({
    title = 'Our Team',
    eyebrow = 'Built By Fans',
    description,
    intro = [],
    members = [],
    culture = null,
    open_roles: openRoles = [],
    contact_email: contactEmail = 'career.madfan@gmail.com',
}) {
    return (
        <LandingChrome title={title} activeHref="/team">
            <header className="mf-land__page-hero">
                <div className="mf-land__page-hero-inner">
                    <p className="mf-land__eyebrow">{eyebrow}</p>
                    <h1>{title}</h1>
                    {description ? <p className="mf-land__page-lead">{description}</p> : null}
                </div>
            </header>

            {intro.map((section, index) => (
                <section
                    key={section.title}
                    className={`mf-land__band${index % 2 === 1 ? ' mf-land__band--mist' : ''}`}
                    aria-labelledby={`team-intro-${index}`}
                >
                    <div className="mf-land__section-head">
                        <div className="mf-land__section-copy">
                            {section.eyebrow ? (
                                <p className="mf-land__eyebrow">{section.eyebrow}</p>
                            ) : null}
                            <h2 id={`team-intro-${index}`}>{section.title}</h2>
                            <div className="mf-land__story-copy">
                                {(section.bodies ?? []).map((paragraph) => (
                                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                    {section.bullets?.length ? (
                        <ul className="mf-land__story-bullets">
                            {section.bullets.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    ) : null}
                </section>
            ))}

            <section
                className={`mf-land__band${intro.length % 2 === 0 ? '' : ' mf-land__band--mist'}`}
                aria-labelledby="team-members-title"
            >
                <div className="mf-land__section-head">
                    <div className="mf-land__section-copy">
                        <p className="mf-land__eyebrow">Leadership</p>
                        <h2 id="team-members-title">Who is building Mad Fan</h2>
                        <p>A lean crew with craft, consistency, and respect for lifelong supporters.</p>
                    </div>
                </div>

                <div className="mf-land__member-grid">
                    {members.map((member) => {
                        const photoSrc = teamPhotoUrl(member.photo);

                        return (
                            <article key={member.name} className="mf-land__member">
                                <div className="mf-land__member-photo">
                                    {photoSrc ? (
                                        <img
                                            src={photoSrc}
                                            alt={`${member.name}, ${member.role}`}
                                            width={320}
                                            height={400}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <span aria-hidden>{member.name.slice(0, 1)}</span>
                                    )}
                                </div>
                                <div className="mf-land__member-body">
                                    <p className="mf-land__info-label">{member.role}</p>
                                    {member.location ? (
                                        <p className="mf-land__member-location">{member.location}</p>
                                    ) : null}
                                    <h3>{member.name}</h3>
                                    <p className="mf-land__member-bio">{member.bio}</p>
                                    {member.focus?.length ? (
                                        <ul className="mf-land__story-bullets mf-land__story-bullets--compact">
                                            {member.focus.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    ) : null}
                                    {member.social ? (
                                        <a
                                            href={member.social.url}
                                            className="mf-land__text-link"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {member.social.label}
                                        </a>
                                    ) : null}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {culture ? (
                <section className="mf-land__band mf-land__band--mist" aria-labelledby="team-culture-title">
                    <div className="mf-land__section-head">
                        <div className="mf-land__section-copy">
                            <p className="mf-land__eyebrow">Culture</p>
                            <h2 id="team-culture-title">{culture.title}</h2>
                            <div className="mf-land__story-copy">
                                {(culture.bodies ?? []).map((paragraph) => (
                                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                    {culture.bullets?.length ? (
                        <ul className="mf-land__story-bullets">
                            {culture.bullets.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    ) : null}
                </section>
            ) : null}

            {openRoles.length > 0 ? (
                <section className="mf-land__band" aria-labelledby="team-roles-title">
                    <div className="mf-land__section-head">
                        <div className="mf-land__section-copy">
                            <p className="mf-land__eyebrow">Join the squad</p>
                            <h2 id="team-roles-title">Open roles</h2>
                            <p>
                                These seats are for people who want to build loyalty infrastructure with staying
                                power: multi season communities, production grade product, and partnerships that
                                compound over years.
                            </p>
                        </div>
                        <a href={`mailto:${contactEmail}`} className="mf-land__pill mf-land__pill--dark">
                            Email {contactEmail}
                        </a>
                    </div>
                    <div className="mf-land__card-grid mf-land__card-grid--3">
                        {openRoles.map((role) => (
                            <article key={role.title} className="mf-land__info-card">
                                <p className="mf-land__info-label">{role.type}</p>
                                <h3>{role.title}</h3>
                                <p>{role.summary}</p>
                            </article>
                        ))}
                    </div>
                </section>
            ) : null}

            <section className="mf-land__cta" aria-label="Continue">
                <div className="mf-land__cta-inner">
                    <p className="mf-land__eyebrow">Season 01 is live</p>
                    <h2>Back home or enter the campaign</h2>
                    <p>Meet the product surface, then earn your standing on Season 01.</p>
                    <div className="mf-land__hero-actions">
                        <Link href="/" className="mf-land__pill mf-land__pill--ghost">
                            ← Back to Mad Fan
                        </Link>
                        <Link href="/campaign" className="mf-land__pill mf-land__pill--light">
                            Enter Season 01
                        </Link>
                        <Link href="/about" className="mf-land__pill mf-land__pill--ghost">
                            About Mad Fan
                        </Link>
                        <Link href="/roadmap" className="mf-land__pill mf-land__pill--ghost">
                            View roadmap
                        </Link>
                    </div>
                </div>
            </section>
        </LandingChrome>
    );
}
