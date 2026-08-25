import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import LoyaltyScoreCard from './LoyaltyScoreCard';
import PointsBreakdown from './PointsBreakdown';
import WalletActivityList from './WalletActivityList';
import WalletBalanceCard from './WalletBalanceCard';
import WalletStatTile from './WalletStatTile';

function IconPost() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="3.5" y="4.5" width="17" height="15" rx="2.4" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeWidth="1.6" d="M7 9.5h10M7 13h10M7 16.5h6" />
        </svg>
    );
}

function IconStage() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="3.1" strokeWidth="1.75" />
            <circle cx="12" cy="12" r="6.6" strokeWidth="1.5" strokeDasharray="3.2 2.4" opacity="0.85" />
            <circle cx="12" cy="12" r="9.4" strokeWidth="1.35" strokeDasharray="2.2 2.8" opacity="0.5" />
        </svg>
    );
}

function IconHeart() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 20.1c-.3 0-.6-.1-.85-.32-2-1.77-3.9-3.46-5.37-5.03C4.03 12.9 3 11.2 3 9.35 3 6.95 4.95 5 7.35 5c1.4 0 2.72.68 3.63 1.83.24.3.7.3.94 0C12.83 5.68 14.15 5 15.55 5 17.95 5 19.9 6.95 19.9 9.35c0 1.85-1.03 3.55-2.78 5.4-1.47 1.57-3.37 3.26-5.37 5.03-.25.22-.55.32-.85.32Z" />
        </svg>
    );
}

function IconReply() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-4 3.2V16H7.5A2.5 2.5 0 0 1 5 13.5v-7Z" />
        </svg>
    );
}

function IconStreak() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2.2c.4 2.6-.6 4-2 5.4C8.4 9 7.2 10.6 7.2 13a4.8 4.8 0 0 0 9.6 0c0-1.5-.5-2.5-1.2-3.4-.2 1.4-1 2.2-1.8 2.2-1 0-1.6-.8-1.4-2 .3-1.8 1.4-2.7 1.4-4.8 0-1-.5-1.9-1.8-2.8Z" />
        </svg>
    );
}

function IconReferral() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="8.5" cy="8" r="2.6" strokeWidth="1.75" />
            <circle cx="17" cy="15.5" r="2.2" strokeWidth="1.6" />
            <path strokeLinecap="round" strokeWidth="1.6" d="M4 18.5c.6-2.6 2.3-4 4.5-4s3.9 1.4 4.5 4M13.5 11.5l2.2 2.2" />
        </svg>
    );
}

/**
 * Fan wallet — total points, loyalty score, where points came from, headline
 * engagement stats (including live stage), and a recent ledger feed.
 */
export default function WalletIndex({ balance, loyalty, breakdown = [], stats = {}, activity = [] }) {
    const tiles = [
        { key: 'posting', value: stats.posting_points ?? 0, label: 'Posting points', hint: `${stats.posts_published ?? 0} posts`, icon: <IconPost /> },
        { key: 'stage', value: stats.stage_engagements ?? 0, label: 'Live stage', hint: `${stats.stages_hosted ?? 0} hosted · ${stats.times_on_mic ?? 0} on mic`, icon: <IconStage /> },
        { key: 'likes', value: stats.likes_received ?? 0, label: 'Likes received', icon: <IconHeart /> },
        { key: 'replies', value: stats.replies_posted ?? 0, label: 'Replies', hint: `${stats.chat_points ?? 0} chat pts`, icon: <IconReply /> },
        { key: 'streak', value: stats.streak_days ?? 0, label: 'Day streak', hint: `best ${stats.best_streak_days ?? 0}`, icon: <IconStreak /> },
        { key: 'referrals', value: stats.referrals ?? 0, label: 'Referrals', icon: <IconReferral /> },
    ];

    return (
        <SocialShell title="Wallet">
            <Head title="Wallet — Mad Fan Social" />

            <div className="mf-wallet">
                <div className="mf-wallet-links">
                    <Link href="/social/leaderboard" className="mf-wallet-links__pill" prefetch>
                        Leaderboard
                    </Link>
                    <Link href="/social/passport" className="mf-wallet-links__pill" prefetch>
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
                            <WalletStatTile
                                key={tile.key}
                                value={tile.value}
                                label={tile.label}
                                hint={tile.hint}
                                icon={tile.icon}
                            />
                        ))}
                    </div>
                </section>

                <PointsBreakdown breakdown={breakdown} />

                <WalletActivityList activity={activity} />
            </div>
        </SocialShell>
    );
}
