import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import CurrentUserRankCard from './CurrentUserRankCard';
import LeaderboardRow from './LeaderboardRow';
import LeaderboardScopeTabs from './LeaderboardScopeTabs';
import TopFansPodium from './TopFansPodium';

function boardCopy(scope, sport, club) {
    if (scope === 'sport' && sport) {
        return { title: `${sport.name} leaderboard`, noun: `${sport.name} fans` };
    }

    if (scope === 'club' && club) {
        return { title: `${club.name} leaderboard`, noun: `${club.name} fans` };
    }

    return { title: 'Top fans', noun: 'fans' };
}

/**
 * Fan leaderboard — a podium card for the top three, then the rest as a
 * ranked table card. Scoped one of three ways (global / sport / club) via
 * {@see LeaderboardScopeTabs}. Capped to a single mobile-width column at
 * every viewport — this is a phone-first surface, not a desktop dashboard.
 */
export default function LeaderboardIndex({
    entries = [],
    current_user: currentUser = null,
    total_fans: totalFans = 0,
    scope = 'global',
    sport = null,
    club = null,
    viewer_sport: viewerSport = null,
    viewer_club: viewerClub = null,
}) {
    const podium = entries.slice(0, 3);
    const rest = entries.slice(3);
    const youInBoard = entries.some((entry) => entry.is_you);
    const copy = boardCopy(scope, sport, club);
    const viewingOtherClub = scope === 'club' && club && club.id !== viewerClub?.id;

    return (
        <SocialShell title="Leaderboard">
            <Head title={`${copy.title} — Mad Fan Social`} />

            <div className="mf-lb">
                <LeaderboardScopeTabs
                    scope={scope}
                    club={club}
                    viewerSport={viewerSport}
                    viewerClub={viewerClub}
                />

                {viewingOtherClub ? (
                    <Link href={`/social/clubs/${club.id}`} className="mf-lb-back">
                        ← Back to {club.name}
                    </Link>
                ) : null}

                {entries.length === 0 ? (
                    <p className="mf-empty">No fans on the board yet. Earn points to claim your spot.</p>
                ) : (
                    <>
                        <section className="mf-lb-podium-card">
                            <header className="mf-lb-podium-card__head">
                                <span className="mf-lb-podium-card__kicker">Winners</span>
                                <span className="mf-lb-podium-card__count">
                                    {totalFans.toLocaleString()} {copy.noun}
                                </span>
                            </header>
                            <TopFansPodium entries={podium} />
                        </section>

                        {rest.length > 0 ? (
                            <section className="mf-lb-table-card">
                                <div className="mf-lb-table-card__head" aria-hidden="true">
                                    <span className="mf-lb-table-card__col-rank">#</span>
                                    <span className="mf-lb-table-card__col-fan">Fan</span>
                                    <span className="mf-lb-table-card__col-points">Points</span>
                                    <span className="mf-lb-table-card__col-score">Score</span>
                                </div>
                                <ol className="mf-lb-list" aria-label="Fans ranked four and below">
                                    {rest.map((entry) => (
                                        <LeaderboardRow key={entry.fan.id} entry={entry} />
                                    ))}
                                </ol>
                            </section>
                        ) : null}
                    </>
                )}

                {currentUser && !youInBoard ? (
                    <div className="mf-lb-you-dock">
                        <p className="mf-lb-you-dock__label mf-text-micro">Your standing</p>
                        <CurrentUserRankCard entry={currentUser} totalFans={totalFans} />
                    </div>
                ) : null}
            </div>
        </SocialShell>
    );
}
