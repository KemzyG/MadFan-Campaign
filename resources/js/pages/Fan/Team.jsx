import { Head, Link } from '@inertiajs/react';
import FanLayout from '../../Layouts/FanLayout';
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
        <FanLayout withSidebar={false}>
            <Head title={title} />

            <div className="wrap static-page-wrap team-page">
                <div className="page-header">
                    <div className="page-eye">{eyebrow}</div>
                    <div className="page-title">{title.toUpperCase()}</div>
                    {description ? <p className="page-sub">{description}</p> : null}
                </div>

                {intro.length > 0 ? (
                    <div className="story-sections team-intro">
                        {intro.map((section) => (
                            <article key={section.title} className="story-section">
                                {section.eyebrow ? <div className="section-eye">{section.eyebrow}</div> : null}
                                <h2 className="story-section__title">{section.title}</h2>
                                <div className="story-section__copy">
                                    {(section.bodies ?? []).map((paragraph) => (
                                        <p key={paragraph.slice(0, 48)} className="story-section__body">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                                {section.bullets?.length ? (
                                    <ul className="story-section__bullets">
                                        {section.bullets.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                ) : null}
                            </article>
                        ))}
                    </div>
                ) : null}

                <section className="team-members" aria-label="Core team">
                    <div className="section-eye">Leadership</div>
                    <h2 className="story-section__title">WHO IS BUILDING MAD FAN</h2>
                    {members.map((member) => {
                        const photoSrc = teamPhotoUrl(member.photo);

                        return (
                            <article key={member.name} className="team-member-card">
                                <div className="team-member-card__media">
                                    {photoSrc ? (
                                        <img
                                            src={photoSrc}
                                            alt={`${member.name}, ${member.role}`}
                                            className="team-member-card__photo"
                                            width={320}
                                            height={400}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <div className="team-member-card__mark" aria-hidden="true">
                                            {member.name.slice(0, 1)}
                                        </div>
                                    )}
                                </div>
                                <div className="team-member-card__body">
                                    <div className="team-member-card__meta">
                                        <span className="team-member-card__role">{member.role}</span>
                                        {member.location ? (
                                            <span className="team-member-card__location">{member.location}</span>
                                        ) : null}
                                    </div>
                                    <h3 className="team-member-card__name">{member.name}</h3>
                                    <p className="team-member-card__bio">{member.bio}</p>
                                    {member.focus?.length ? (
                                        <ul className="team-member-card__focus">
                                            {member.focus.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    ) : null}
                                    {member.social ? (
                                        <a
                                            href={member.social.url}
                                            className="team-member-card__social"
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
                </section>

                {culture ? (
                    <section className="team-culture story-section" aria-labelledby="team-culture-title">
                        <div className="section-eye">Culture</div>
                        <h2 id="team-culture-title" className="story-section__title">
                            {culture.title}
                        </h2>
                        <div className="story-section__copy">
                            {(culture.bodies ?? []).map((paragraph) => (
                                <p key={paragraph.slice(0, 48)} className="story-section__body">
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                        {culture.bullets?.length ? (
                            <ul className="story-section__bullets">
                                {culture.bullets.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        ) : null}
                    </section>
                ) : null}

                {openRoles.length > 0 ? (
                    <section className="team-roles" aria-labelledby="team-roles-title">
                        <div className="section-eye">Join the Squad</div>
                        <h2 id="team-roles-title" className="story-section__title">
                            OPEN ROLES
                        </h2>
                        <p className="story-section__body">
                            These seats are for people who want to build loyalty infrastructure with staying power:
                            multi season communities, production grade product, and partnerships that compound over
                            years. If that is you, write to us.
                        </p>
                        <div className="team-roles__grid">
                            {openRoles.map((role) => (
                                <div key={role.title} className="team-role-card">
                                    <div className="team-role-card__type">{role.type}</div>
                                    <div className="team-role-card__title">{role.title}</div>
                                    <p className="team-role-card__summary">{role.summary}</p>
                                </div>
                            ))}
                        </div>
                        <a href={`mailto:${contactEmail}`} className="btn-join team-roles__cta">
                            Email {contactEmail}
                        </a>
                    </section>
                ) : null}

                <div className="static-page-cta">
                    <Link href="/about" className="btn-action btn-go">
                        About Mad Fan
                    </Link>
                    <Link href="/roadmap" className="btn-action btn-go">
                        View roadmap
                    </Link>
                    <Link href="/" className="btn-action btn-go">
                        ← Back to Season 01
                    </Link>
                </div>
            </div>
        </FanLayout>
    );
}
