import { Link } from '@inertiajs/react';

/**
 * Trending subsets across every category — a specific league, game, or
 * rivalry, not a whole fandom. Subsets don't have their own hub yet, so a
 * card opens the category it belongs to (fandom.slug on the subset).
 */
export default function TrendingNow({ subsets }) {
    if (subsets.length === 0) {
        return null;
    }

    return (
        <section className="mf-fd-section mf-fd-section--trending">
            <div className="mf-fd-section__head">
                <h2 className="mf-fd-section__title">🔥 Trending Now</h2>
            </div>
            <div className="mf-fd-row mf-fd-trending-row">
                {subsets.map((subset) => (
                    <Link
                        key={subset.id}
                        href={subset.fandom ? `/social/fandom/${subset.fandom.slug}` : '/social/fandom'}
                        className="mf-fd-trend-card"
                    >
                        <div
                            className={`mf-fd-trend-card__cover ${!subset.image_url ? 'mf-fd-trend-card__cover--icon' : ''}`.trim()}
                            style={subset.image_url ? { backgroundImage: `url(${subset.image_url})` } : undefined}
                        >
                            {!subset.image_url ? (
                                <span aria-hidden>{subset.fandom?.icon ?? '🔥'}</span>
                            ) : null}
                        </div>
                        <p className="mf-fd-trend-card__name truncate">{subset.name}</p>
                        <p className="mf-fd-trend-card__count mf-mono">{subset.fan_count.toLocaleString()} fans</p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
