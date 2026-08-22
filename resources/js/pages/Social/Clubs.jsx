import { Head, Link, router, usePage } from '@inertiajs/react';
import SocialShell from '../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../lib/defaultImage';

function ClubCrest({ club }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    if (club?.logo_url) {
        return (
            <img
                src={club.logo_url}
                alt=""
                className="mf-standings-crest__img"
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }

    return (
        <span className="mf-standings-crest__mark mf-display" aria-hidden>
            {(club?.short || club?.name || '?').slice(0, 3)}
        </span>
    );
}

function formatGoalDifference(value) {
    if (value > 0) {
        return `+${value}`;
    }

    return String(value);
}

function StandingsTable({ rows = [] }) {
    return (
        <div className="mf-standings-table-wrap">
            <table className="mf-standings-table">
                <thead>
                    <tr>
                        <th scope="col" className="mf-standings-table__pos">
                            #
                        </th>
                        <th scope="col" className="mf-standings-table__club">
                            Club
                        </th>
                        <th scope="col" className="mf-standings-table__num" aria-label="Played">
                            P
                        </th>
                        <th scope="col" className="mf-standings-table__num" aria-label="Won">
                            W
                        </th>
                        <th scope="col" className="mf-standings-table__num" aria-label="Drawn">
                            D
                        </th>
                        <th scope="col" className="mf-standings-table__num" aria-label="Lost">
                            L
                        </th>
                        <th scope="col" className="mf-standings-table__num mf-standings-table__hide-sm" aria-label="Goals for">
                            GF
                        </th>
                        <th scope="col" className="mf-standings-table__num mf-standings-table__hide-sm" aria-label="Goals against">
                            GA
                        </th>
                        <th scope="col" className="mf-standings-table__num" aria-label="Goal difference">
                            GD
                        </th>
                        <th scope="col" className="mf-standings-table__pts">
                            Pts
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.club.id}
                            className={[
                                row.is_favourite ? 'is-favourite' : '',
                                row.position <= 4 ? 'is-top' : '',
                                row.position >= rows.length - 2 ? 'is-bottom' : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                        >
                            <td className="mf-standings-table__pos mf-mono">{row.position}</td>
                            <td className="mf-standings-table__club">
                                <span className="mf-standings-club">
                                    <span className="mf-standings-crest">
                                        <ClubCrest club={row.club} />
                                    </span>
                                    <span className="mf-standings-club__copy">
                                        <span className="mf-standings-club__name">{row.club.name}</span>
                                        <span className="mf-standings-club__short mf-mono">{row.club.short}</span>
                                    </span>
                                    {row.is_favourite ? (
                                        <span className="mf-standings-fav mf-text-micro">Your club</span>
                                    ) : null}
                                </span>
                            </td>
                            <td className="mf-standings-table__num mf-mono">{row.played}</td>
                            <td className="mf-standings-table__num mf-mono">{row.won}</td>
                            <td className="mf-standings-table__num mf-mono">{row.drawn}</td>
                            <td className="mf-standings-table__num mf-mono">{row.lost}</td>
                            <td className="mf-standings-table__num mf-mono mf-standings-table__hide-sm">
                                {row.goals_for}
                            </td>
                            <td className="mf-standings-table__num mf-mono mf-standings-table__hide-sm">
                                {row.goals_against}
                            </td>
                            <td className="mf-standings-table__num mf-mono">{formatGoalDifference(row.goal_difference)}</td>
                            <td className="mf-standings-table__pts mf-mono">{row.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function Clubs({
    leagues = [],
    table = null,
    filters = {},
    favourite_club_id: favouriteClubId = null,
}) {
    const activeLeagueId = filters.league_id ?? table?.league?.id ?? null;

    function setLeague(leagueId) {
        router.get(
            '/social/clubs',
            { league_id: leagueId === activeLeagueId ? undefined : leagueId },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    return (
        <SocialShell title="League table">
            <Head title="League table — Mad Fan Social" />

            <div className="mf-standings">
                <header className="mf-standings-hero">
                    <p className="mf-tickets-kicker mf-text-caption">Match centre</p>
                    <p className="mf-empty-title mf-tickets-title">League table</p>
                    <div className="mf-standings-hero__links">
                        <Link href="/social/fixtures" className="mf-tickets-mine-link" prefetch>
                            Fixtures
                        </Link>
                        <Link href="/social/tickets" className="mf-tickets-mine-link" prefetch>
                            Box office
                        </Link>
                    </div>
                </header>

                {leagues.length > 0 ? (
                    <div className="mf-standings-tabs" role="tablist" aria-label="League filters">
                        {leagues.map((league) => (
                            <button
                                key={league.id}
                                type="button"
                                role="tab"
                                aria-selected={String(activeLeagueId) === String(league.id)}
                                className={String(activeLeagueId) === String(league.id) ? 'is-active' : ''}
                                onClick={() => setLeague(league.id)}
                            >
                                {league.short}
                                <span className="mf-standings-tabs__name">{league.name}</span>
                            </button>
                        ))}
                    </div>
                ) : null}

                {table ? (
                    <>
                        <div className="mf-standings-meta">
                            <h2 className="mf-standings-meta__title">{table.league.name}</h2>
                            <p className="mf-text-meta text-[var(--mf-muted)]">
                                {table.rows.length} clubs
                                {favouriteClubId ? ' · your club highlighted' : ''}
                            </p>
                        </div>
                        <StandingsTable rows={table.rows} />
                        <p className="mf-standings-legend mf-text-micro text-[var(--mf-muted)]">
                            Top four and relegation zone markers follow standard league convention.
                        </p>
                    </>
                ) : (
                    <p className="mf-standings-empty mf-text-meta text-[var(--mf-muted)]">
                        No standings available yet for this league.
                    </p>
                )}
            </div>
        </SocialShell>
    );
}
