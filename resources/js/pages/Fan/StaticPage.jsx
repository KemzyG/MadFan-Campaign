import { Head, Link } from '@inertiajs/react';
import FanLayout from '../../Layouts/FanLayout';

function StoryCopy({ body, bodies }) {
    const paragraphs = bodies?.length ? bodies : body ? [body] : [];

    if (paragraphs.length === 0) {
        return null;
    }

    return (
        <div className="story-section__copy">
            {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="story-section__body">
                    {paragraph}
                </p>
            ))}
        </div>
    );
}

/**
 * @param {{
 *   title: string,
 *   eyebrow?: string,
 *   description?: string,
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
    sections = [],
}) {
    return (
        <FanLayout withSidebar={false}>
            <Head title={title} />

            <div className="wrap static-page-wrap">
                <div className="page-header">
                    <div className="page-eye">{eyebrow}</div>
                    <div className="page-title">{title.toUpperCase()}</div>
                    {description ? <p className="page-sub">{description}</p> : null}
                </div>

                <div className="story-sections">
                    {sections.map((section) => (
                        <article key={section.title} className="story-section">
                            {section.eyebrow ? <div className="section-eye">{section.eyebrow}</div> : null}
                            <h2 className="story-section__title">{section.title}</h2>
                            <StoryCopy body={section.body} bodies={section.bodies} />

                            {section.bullets?.length ? (
                                <ul className="story-section__bullets">
                                    {section.bullets.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            ) : null}

                            {section.cards?.length ? (
                                <div className="story-cards">
                                    {section.cards.map((card) => (
                                        <div key={card.title} className="story-card">
                                            <div className="story-card__label">{card.label}</div>
                                            <div className="story-card__title">{card.title}</div>
                                            <p className="story-card__body">{card.body}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </article>
                    ))}
                </div>

                <div className="static-page-cta">
                    <Link href="/" className="btn-action btn-go">
                        ← Back to Season 01
                    </Link>
                </div>
            </div>
        </FanLayout>
    );
}
