const ITEMS = [
    { key: 'fans_active_today', label: 'fans active today' },
    { key: 'posts_today', label: 'posts today' },
    { key: 'live_discussions', label: 'live discussions' },
    { key: 'challenges_active', label: 'challenges active' },
    { key: 'fans_earned_points_today', label: 'fans earned points today' },
];

/**
 * "Fandom Pulse" — a living-stadium feel rather than a static community
 * page. Pure stats, no actions; the point is just proof of life.
 */
export default function PulseStrip({ pulse }) {
    return (
        <section className="mf-fh-pulse" aria-label="Fandom pulse">
            <p className="mf-fh-pulse__label">🔥 Fandom Pulse</p>
            <div className="mf-fh-pulse__row">
                {ITEMS.map((item) => (
                    <div key={item.key} className="mf-fh-pulse__stat">
                        <span className="mf-mono mf-fh-pulse__value">{(pulse[item.key] ?? 0).toLocaleString()}</span>
                        <span className="mf-fh-pulse__caption">{item.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
