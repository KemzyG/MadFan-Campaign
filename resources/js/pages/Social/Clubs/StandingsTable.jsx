import ClubCrest from './ClubCrest';

function formatGoalDifference(value) {
    return value > 0 ? `+${value}` : String(value);
}

/**
 * The league standings table — the master pane. Each row is selectable and
 * drives the detail card; the active row is highlighted and, on phones, opening
 * a row is what raises the detail sheet.
 */
export default function StandingsTable({ rows = [], selectedClubId, onSelect }) {
    return (
        <div className="mf-club-table-wrap">
            <table className="mf-club-table">
                <thead>
                    <tr>
                        <th scope="col" className="mf-club-table__pos">#</th>
                        <th scope="col" className="mf-club-table__club">Club</th>
                        <th scope="col" className="mf-club-table__num" aria-label="Played">P</th>
                        <th scope="col" className="mf-club-table__num" aria-label="Won">W</th>
                        <th scope="col" className="mf-club-table__num" aria-label="Drawn">D</th>
                        <th scope="col" className="mf-club-table__num" aria-label="Lost">L</th>
                        <th scope="col" className="mf-club-table__num mf-club-table__hide-sm" aria-label="Goals for">GF</th>
                        <th scope="col" className="mf-club-table__num mf-club-table__hide-sm" aria-label="Goals against">GA</th>
                        <th scope="col" className="mf-club-table__num" aria-label="Goal difference">GD</th>
                        <th scope="col" className="mf-club-table__pts">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const selected = String(row.club.id) === String(selectedClubId);

                        return (
                            <tr
                                key={row.club.id}
                                className={[
                                    'mf-club-row',
                                    selected ? 'is-selected' : '',
                                    row.is_favourite ? 'is-favourite' : '',
                                    row.position <= 4 ? 'is-top' : '',
                                    row.position >= rows.length - 2 ? 'is-bottom' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                tabIndex={0}
                                aria-selected={selected}
                                onClick={() => onSelect(row)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        onSelect(row);
                                    }
                                }}
                            >
                                <td className="mf-club-table__pos mf-mono">{row.position}</td>
                                <td className="mf-club-table__club">
                                    <span className="mf-club-cell">
                                        <ClubCrest club={row.club} size="sm" />
                                        <span className="mf-club-cell__copy">
                                            <span className="mf-club-cell__name">{row.club.name}</span>
                                            <span className="mf-club-cell__short mf-mono">{row.club.short}</span>
                                        </span>
                                        {row.is_favourite ? (
                                            <span className="mf-club-cell__fav mf-text-micro">Your club</span>
                                        ) : null}
                                    </span>
                                </td>
                                <td className="mf-club-table__num mf-mono">{row.played}</td>
                                <td className="mf-club-table__num mf-mono">{row.won}</td>
                                <td className="mf-club-table__num mf-mono">{row.drawn}</td>
                                <td className="mf-club-table__num mf-mono">{row.lost}</td>
                                <td className="mf-club-table__num mf-mono mf-club-table__hide-sm">{row.goals_for}</td>
                                <td className="mf-club-table__num mf-mono mf-club-table__hide-sm">{row.goals_against}</td>
                                <td className="mf-club-table__num mf-mono">{formatGoalDifference(row.goal_difference)}</td>
                                <td className="mf-club-table__pts mf-mono">{row.points}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
