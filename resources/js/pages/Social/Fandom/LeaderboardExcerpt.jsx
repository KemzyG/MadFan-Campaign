import { Link } from '@inertiajs/react';

export default function LeaderboardExcerpt({ leaderboard }) {
    const entries = leaderboard?.entries ?? [];

    if (entries.length === 0) {
        return null;
    }

    return (
        <section className="mf-fh-section">
            <div className="mf-fh-section__head">
                <h2 className="mf-fh-section__title">🏆 Leaderboard</h2>
                <Link href="/social/leaderboard?scope=fandom" className="mf-fh-section__more">
                    Full board →
                </Link>
            </div>

            <ol className="mf-fh-lb-list">
                {entries.map((entry) => (
                    <li key={entry.fan.id} className={`mf-fh-lb-row${entry.is_you ? ' is-you' : ''}`}>
                        <span className="mf-mono mf-fh-lb-row__rank">{entry.rank}</span>
                        <span className="mf-fh-lb-row__handle truncate">@{entry.fan.handle}</span>
                        <span className="mf-mono mf-fh-lb-row__points">{entry.points.toLocaleString()} pts</span>
                    </li>
                ))}
            </ol>
        </section>
    );
}
