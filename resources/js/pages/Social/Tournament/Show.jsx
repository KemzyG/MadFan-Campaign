import { Head } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import Crest from '../components/Crest';
import { formatKickoff } from '../components/StadiumTicket';

function StatusBadge({ fixture }) {
    if (fixture.status === 'live') {
        return <span className="mf-tn-badge mf-tn-badge--live">Live</span>;
    }
    if (fixture.status === 'finished') {
        return <span className="mf-tn-badge">FT</span>;
    }

    return <span className="mf-tn-badge mf-tn-badge--kick mf-mono">{formatKickoff(fixture.kickoff_at, 'short')}</span>;
}

function FixtureRow({ fixture }) {
    return (
        <div className={`mf-tn-fixture${fixture.status === 'live' ? ' is-live' : ''}`}>
            <span className="mf-tn-fixture__side">
                <Crest club={fixture.home} size="sm" />
                <span className="mf-tn-fixture__team">{fixture.home?.short || fixture.home?.name}</span>
            </span>

            <span className="mf-tn-fixture__mid">
                {fixture.status === 'finished' ? (
                    <span className="mf-mono mf-tn-fixture__score">
                        {fixture.home_score} – {fixture.away_score}
                    </span>
                ) : (
                    <StatusBadge fixture={fixture} />
                )}
            </span>

            <span className="mf-tn-fixture__side mf-tn-fixture__side--away">
                <span className="mf-tn-fixture__team">{fixture.away?.short || fixture.away?.name}</span>
                <Crest club={fixture.away} size="sm" />
            </span>
        </div>
    );
}

export default function TournamentShow({ tournament }) {
    const { competition, standings, fixtures } = tournament;
    const live = fixtures.filter((f) => f.status === 'live');
    const upcoming = fixtures.filter((f) => f.status === 'upcoming');
    const finished = fixtures.filter((f) => f.status === 'finished');

    return (
        <SocialShell title={competition}>
            <Head title={`${competition} · Mad Fan`} />

            <div className="mf-tn-page">
                <h1 className="mf-tn-title">{competition}</h1>

                {standings.length > 0 ? (
                    <div className="mf-tn-table-wrap">
                        <table className="mf-tn-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Club</th>
                                    <th>P</th>
                                    <th>W</th>
                                    <th>D</th>
                                    <th>L</th>
                                    <th>GD</th>
                                    <th>Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map((row) => (
                                    <tr key={row.club.id}>
                                        <td>{row.position}</td>
                                        <td className="mf-tn-table__club">
                                            <Crest club={row.club} size="sm" />
                                            <span>{row.club.short || row.club.name}</span>
                                        </td>
                                        <td>{row.played}</td>
                                        <td>{row.won}</td>
                                        <td>{row.drawn}</td>
                                        <td>{row.lost}</td>
                                        <td>{row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}</td>
                                        <td className="mf-tn-table__points">{row.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="mf-tn-empty">No results yet — the table fills in once fixtures finish.</p>
                )}

                {live.length > 0 ? (
                    <section className="mf-tn-section">
                        <h2 className="mf-tn-section__title">Live now</h2>
                        {live.map((fixture) => (
                            <FixtureRow key={fixture.id} fixture={fixture} />
                        ))}
                    </section>
                ) : null}

                {upcoming.length > 0 ? (
                    <section className="mf-tn-section">
                        <h2 className="mf-tn-section__title">Upcoming</h2>
                        {upcoming.map((fixture) => (
                            <FixtureRow key={fixture.id} fixture={fixture} />
                        ))}
                    </section>
                ) : null}

                {finished.length > 0 ? (
                    <section className="mf-tn-section">
                        <h2 className="mf-tn-section__title">Results</h2>
                        {finished.map((fixture) => (
                            <FixtureRow key={fixture.id} fixture={fixture} />
                        ))}
                    </section>
                ) : null}
            </div>
        </SocialShell>
    );
}
