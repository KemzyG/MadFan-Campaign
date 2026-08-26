import { Head, Link } from '@inertiajs/react';
import LandingChrome from '../../Components/Fan/LandingChrome';

function slugify(heading) {
    return heading
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/**
 * @param {{
 *   slug: string,
 *   title: string,
 *   effective_date: string,
 *   intro: string[],
 *   sections: Array<{ heading: string, body?: string[], bullets?: string[] }>,
 * }} props
 */
export default function Legal({ slug, title, effective_date: effectiveDate, intro = [], sections = [] }) {
    const activeHref = slug ? `/${slug}` : undefined;
    const sibling = slug === 'privacy'
        ? { href: '/terms', label: 'Terms & Conditions' }
        : { href: '/privacy', label: 'Privacy Policy' };

    return (
        <LandingChrome title={title} activeHref={activeHref}>
            <header className="mf-land__page-hero">
                <div className="mf-land__page-hero-inner">
                    <p className="mf-land__eyebrow">Mad Fan</p>
                    <h1>{title}</h1>
                    <p className="mf-land__page-lead">Effective date: {effectiveDate}</p>
                </div>
            </header>

            <div className="mf-land__legal-page">
                <div className="mf-land__legal-inner">
                    <aside className="mf-land__legal-toc" aria-label="Table of contents">
                        <p className="mf-land__info-label">On this page</p>
                        <ol>
                            {sections.map((section, index) => (
                                <li key={section.heading}>
                                    <a href={`#${slugify(section.heading)}`}>
                                        {index + 1}. {section.heading}
                                    </a>
                                </li>
                            ))}
                        </ol>
                        <Link href={sibling.href} className="mf-land__text-link">
                            Read {sibling.label} →
                        </Link>
                    </aside>

                    <div className="mf-land__legal-doc">
                        {intro.map((paragraph) => (
                            <p key={paragraph.slice(0, 48)} className="mf-land__legal-intro">
                                {paragraph}
                            </p>
                        ))}

                        {sections.map((section, index) => (
                            <section
                                key={section.heading}
                                id={slugify(section.heading)}
                                className="mf-land__legal-section"
                            >
                                <h2>
                                    <span className="mf-land__legal-num">{index + 1}</span>
                                    {section.heading}
                                </h2>
                                {section.body?.map((paragraph) => (
                                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                                ))}
                                {section.bullets?.length ? (
                                    <ul>
                                        {section.bullets.map((item) => (
                                            <li key={item.slice(0, 48)}>{item}</li>
                                        ))}
                                    </ul>
                                ) : null}
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </LandingChrome>
    );
}
