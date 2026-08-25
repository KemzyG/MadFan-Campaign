import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import FanAvatar from '../Leaderboard/FanAvatar';
import ClubCrest from './ClubCrest';
import ClubDetailCard from './ClubDetailCard';

function TopFanRow({ entry }) {
    const { fan } = entry;

    return (
        <li className={`mf-club-fan-row${entry.is_you ? ' is-you' : ''}`}>
            <span className="mf-club-fan-row__rank mf-mono">{entry.rank}</span>
            <FanAvatar fan={fan} size="sm" />
            <span className="mf-club-fan-row__identity">
                <span className="mf-club-fan-row__handle mf-mono">
                    @{fan.handle}
                    {entry.is_you ? <span className="mf-club-fan-row__you-tag mf-text-micro">You</span> : null}
                </span>
            </span>
            <span className="mf-club-fan-row__points mf-mono">{entry.points.toLocaleString()} pts</span>
        </li>
    );
}

/**
 * A single club's public profile — season standing (reusing the standings
 * page's detail card), fan community size, and its top fans by points.
 */
export default function Show({ club, standing, member_count: memberCount, top_fans: topFans = [], is_favourite: isFavourite }) {
    return (
        <SocialShell title={club?.name || 'Club'} backHref="/social/clubs">
            <Head title={club ? `${club.name} — Mad Fan Social` : 'Club'} />

            <div className="mf-club-page mf-club-profile-page">
                {standing?.row ? (
                    <ClubDetailCard
                        row={standing.row}
                        leagueSize={standing.total_clubs}
                        leagueName={standing.league?.name || club?.league}
                    />
                ) : (
                    <article className="mf-club-detail mf-panel-card">
                        <header className="mf-club-detail__head">
                            <ClubCrest club={club} size="lg" />
                            <div className="mf-club-detail__id">
                                <p className="mf-club-detail__eyebrow mf-text-caption">
                                    {club?.league || 'League'}
                                </p>
                                <h2 className="mf-club-detail__name mf-display">{club?.name}</h2>
                            </div>
                        </header>
                        <p className="mf-text-meta text-[var(--mf-muted)]">
                            No standings available for this club yet.
                        </p>
                    </article>
                )}

                <div className="mf-panel-card mf-club-fans">
                    <header className="mf-panel-card__head">
                        <div>
                            <p className="mf-panel-card__title">Fan community</p>
                            <p className="mf-panel-card__hint">
                                {memberCount} {memberCount === 1 ? 'fan' : 'fans'} on the terrace
                                {isFavourite ? ' · this is your club' : ''}
                            </p>
                        </div>
                        <Link href={`/social/leaderboard?scope=club&club_id=${club.id}`} className="mf-tickets-mine-link">
                            Leaderboard
                        </Link>
                    </header>

                    {topFans.length === 0 ? (
                        <p className="mf-club-empty mf-text-meta text-[var(--mf-muted)]">
                            No fans have picked {club?.name || 'this club'} yet.
                        </p>
                    ) : (
                        <ul className="mf-club-fans__list">
                            {topFans.map((entry) => (
                                <TopFanRow key={entry.fan.id} entry={entry} />
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </SocialShell>
    );
}
