/**
 * Where the fan's points came from — one bar per category (posting, replies,
 * likes, chat, campaign), widest share first.
 */
export default function PointsBreakdown({ breakdown = [] }) {
    if (breakdown.length === 0) {
        return (
            <section className="mf-wallet-breakdown" aria-label="Points breakdown">
                <h2 className="mf-wallet-section__title mf-text-meta">Points breakdown</h2>
                <p className="mf-empty">No points earned yet — start posting to fill this in.</p>
            </section>
        );
    }

    return (
        <section className="mf-wallet-breakdown" aria-label="Points breakdown">
            <h2 className="mf-wallet-section__title mf-text-meta">Points breakdown</h2>
            <ul className="mf-wallet-breakdown__list">
                {breakdown.map((row) => (
                    <li key={row.key} className="mf-wallet-breakdown__row">
                        <div className="mf-wallet-breakdown__head">
                            <span className="mf-wallet-breakdown__label">{row.label}</span>
                            <span className="mf-wallet-breakdown__points mf-mono">
                                {row.points.toLocaleString()}
                                <span className="mf-wallet-breakdown__percent"> · {row.percent}%</span>
                            </span>
                        </div>
                        <div className="mf-wallet-bar">
                            <span className="mf-wallet-bar__fill" style={{ width: `${row.percent}%` }} />
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
