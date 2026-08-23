import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import LoyaltyScoreCard from './LoyaltyScoreCard';
import PointsBreakdown from './PointsBreakdown';
import WalletActivityList from './WalletActivityList';
import WalletBalanceCard from './WalletBalanceCard';
import WalletStatTile from './WalletStatTile';

/**
 * Fan wallet — total points, loyalty score, where points came from, headline
 * engagement stats (including live stage), and a recent ledger feed.
 */
export default function WalletIndex({ balance, loyalty, breakdown = [], stats = {}, activity = [] }) {
    const tiles = [
        { key: 'posting', value: stats.posting_points ?? 0, label: 'Posting points', hint: `${stats.posts_published ?? 0} posts` },
        { key: 'stage', value: stats.stage_engagements ?? 0, label: 'Live stage', hint: `${stats.stages_hosted ?? 0} hosted · ${stats.times_on_mic ?? 0} on mic` },
        { key: 'likes', value: stats.likes_received ?? 0, label: 'Likes received' },
        { key: 'replies', value: stats.replies_posted ?? 0, label: 'Replies', hint: `${stats.chat_points ?? 0} chat pts` },
        { key: 'streak', value: stats.streak_days ?? 0, label: 'Day streak', hint: `best ${stats.best_streak_days ?? 0}` },
        { key: 'referrals', value: stats.referrals ?? 0, label: 'Referrals' },
    ];

    return (
        <SocialShell title="Wallet">
            <Head title="Wallet — Mad Fan Social" />

            <div className="mf-wallet">
                <div className="mf-page-links">
                    <Link href="/social/leaderboard" className="mf-tickets-mine-link" prefetch>
                        Leaderboard
                    </Link>
                    <Link href="/social/passport" className="mf-tickets-mine-link" prefetch>
                        Passport
                    </Link>
                </div>

                <div className="mf-wallet-hero">
                    <WalletBalanceCard balance={balance} />
                    <LoyaltyScoreCard loyalty={loyalty} />
                </div>

                <section className="mf-wallet-stats" aria-label="Activity stats">
                    <h2 className="mf-wallet-section__title mf-text-meta">Your stats</h2>
                    <div className="mf-wallet-stats__grid">
                        {tiles.map((tile) => (
                            <WalletStatTile key={tile.key} value={tile.value} label={tile.label} hint={tile.hint} />
                        ))}
                    </div>
                </section>

                <PointsBreakdown breakdown={breakdown} />

                <WalletActivityList activity={activity} />
            </div>
        </SocialShell>
    );
}
