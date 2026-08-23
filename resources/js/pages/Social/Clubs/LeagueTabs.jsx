/**
 * League switcher tabs for the standings page. Purely presentational — the
 * parent owns the active id and the router visit.
 */
export default function LeagueTabs({ leagues = [], activeLeagueId, onSelect }) {
    if (leagues.length === 0) {
        return null;
    }

    return (
        <div className="mf-club-leagues" role="tablist" aria-label="League filters">
            {leagues.map((league) => {
                const active = String(activeLeagueId) === String(league.id);

                return (
                    <button
                        key={league.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={active ? 'is-active' : ''}
                        onClick={() => onSelect(league.id)}
                    >
                        <span className="mf-club-leagues__short mf-mono">{league.short}</span>
                        <span className="mf-club-leagues__name">{league.name}</span>
                    </button>
                );
            })}
        </div>
    );
}
