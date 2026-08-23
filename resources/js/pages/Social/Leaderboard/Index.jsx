import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import CurrentUserRankCard from './CurrentUserRankCard';
import LeaderboardRow from './LeaderboardRow';
import TopFansPodium from './TopFansPodium';

/**
 * Fan leaderboard — the top fans ranked by lifetime points, each carrying a
 * composite loyalty score (your activity + club form + global standing).
 */
export default function LeaderboardIndex({ entries = [], current_user: currentUser = null, total_fans: totalFans = 0 }) {
    const podium = entries.slice(0, 3);
    const rest = entries.slice(3);
    const youInBoard = entries.some((entry) => entry.is_you);

    return (
        <SocialShell title="Leaderboard">
            <Head title="Leaderboard — Mad Fan Social" />

            <div className="mf-lb">
                <div className="mf-page-links">
                    <Link href="/social/wallet" className="mf-tickets-mine-link" prefetch>
                        Your wallet
                    </Link>
                    <Link href="/social/passport" className="mf-tickets-mine-link" prefetch>
                        Passport
                    </Link>
                </div>

                <header className="mf-lb-head">
                    <h1 className="mf-lb-head__title mf-display">Top fans</h1>
                    <p className="mf-lb-head__sub mf-text-meta">
                        Ranked by points across {totalFans.toLocaleString()} fans. Loyalty score blends your activity,
                        your club&rsquo;s form and your global standing.
                    </p>
                </header>

                {entries.length === 0 ? (
                    <p className="mf-empty">No fans on the board yet. Earn points to claim your spot.</p>
                ) : (
                    <>
                        <TopFansPodium entries={podium} />

                        {rest.length > 0 ? (
                            <ol className="mf-lb-list" aria-label="Fans ranked four and below">
                                {rest.map((entry) => (
                                    <LeaderboardRow key={entry.fan.id} entry={entry} />
                                ))}
                            </ol>
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
