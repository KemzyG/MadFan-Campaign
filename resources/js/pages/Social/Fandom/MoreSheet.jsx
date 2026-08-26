import { Link } from '@inertiajs/react';

/**
 * "More" tab: everything that doesn't fit the primary Home/Feed/Live/Events
 * bar — links, static About/History/Rules copy, and a media strip — so the
 * hub itself stays uncluttered.
 */
export default function MoreSheet({ more, fandomSlug }) {
    const media = more?.media ?? [];

    const links = [
        { href: `/social/fandom/${fandomSlug}/members`, label: 'Members', hint: 'Everyone in this fandom' },
        { href: '/social/leaderboard?scope=fandom', label: 'Leaderboard', hint: 'Top fans, ranked' },
        { href: '/campaign', label: 'Challenges', hint: 'The full task board' },
        { href: '/social/wallet', label: 'Rewards', hint: 'Points, streaks & balance' },
    ];

    return (
        <div className="mf-fh-more">
            <nav className="mf-fh-more__links">
                {links.map((link) => (
                    <Link key={link.href} href={link.href} className="mf-fh-more__link">
                        <span className="mf-fh-more__link-label">{link.label}</span>
                        <span className="mf-fh-more__link-hint mf-text-meta">{link.hint}</span>
                    </Link>
                ))}
            </nav>

            <section className="mf-fh-section">
                <h2 className="mf-fh-section__title">About</h2>
                <p className="mf-fh-more__about">{more?.about?.description}</p>
            </section>

            {media.length > 0 ? (
                <section className="mf-fh-section">
                    <div className="mf-fh-section__head">
                        <h2 className="mf-fh-section__title">Media</h2>
                        <Link href="/social/videos" className="mf-fh-section__more">
                            All shorts →
                        </Link>
                    </div>
                    <div className="mf-fh-media-strip">
                        {media.map((item) => (
                            <a
                                key={item.id}
                                href={`/social/videos#${item.id}`}
                                className="mf-fh-media-tile"
                                style={item.thumbnail_url ? { backgroundImage: `url(${item.thumbnail_url})` } : undefined}
                            >
                                {!item.thumbnail_url ? <span aria-hidden>🎬</span> : null}
                            </a>
                        ))}
                    </div>
                </section>
            ) : null}

            <section className="mf-fh-section">
                <h2 className="mf-fh-section__title">History</h2>
                {(more?.history ?? []).map((entry) => (
                    <div key={entry.heading} className="mf-fh-more__history-entry">
                        <p className="mf-fh-more__history-heading">{entry.heading}</p>
                        <p className="mf-text-meta">{entry.body}</p>
                    </div>
                ))}
            </section>

            <section className="mf-fh-section">
                <h2 className="mf-fh-section__title">Fandom rules</h2>
                <ul className="mf-fh-more__rules">
                    {(more?.rules ?? []).map((rule) => (
                        <li key={rule}>{rule}</li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
