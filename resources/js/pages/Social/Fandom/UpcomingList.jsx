function formatKickoff(iso) {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return '';
    }
}

export default function UpcomingList({ fixtures = [] }) {
    if (fixtures.length === 0) {
        return null;
    }

    return (
        <section className="mf-fh-section">
            <div className="mf-fh-section__head">
                <h2 className="mf-fh-section__title">📅 Upcoming</h2>
            </div>

            <ul className="mf-fh-upcoming-list">
                {fixtures.map((fixture) => (
                    <li key={fixture.id} className="mf-fh-upcoming-row">
                        <span className="mf-fh-upcoming-row__matchup truncate">
                            {fixture.home?.short || fixture.home?.name} vs {fixture.away?.short || fixture.away?.name}
                        </span>
                        <span className="mf-fh-upcoming-row__when mf-text-meta">{formatKickoff(fixture.kickoff_at)}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
