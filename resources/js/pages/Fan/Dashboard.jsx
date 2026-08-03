import { Head, Link } from '@inertiajs/react';
import FanLayout from '../../Layouts/FanLayout';

function MetricCard({ label, value }) {
    return (
        <div className="staff-metric-card">
            <div className="staff-metric-label">{label}</div>
            <div className="staff-metric-value">{value}</div>
        </div>
    );
}

function formatPoints(value) {
    return Number(value ?? 0).toLocaleString();
}

function formatWhen(iso) {
    if (!iso) {
        return 'N/A';
    }

    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function Dashboard({
    summary = null,
    by_source: bySource = [],
    recent_transactions: recentTransactions = [],
    daily_series: dailySeries = [],
    fan,
}) {
    const maxDayPoints = Math.max(1, ...dailySeries.map((day) => day.points));
    const maxSourceTotal = Math.max(1, ...bySource.map((row) => row.total));

    return (
        <FanLayout pointsLabel="TOTAL PTS">
            <Head title="Dashboard" />

            <div className="wrap">
                <div className="page-header"> 
                </div>

                <section className="dashboard-balance-card" aria-label="Your point balance">
                    <div className="dashboard-balance-main">
                        <div className="dashboard-balance-eyebrow">Available Balance</div>
                        <div className="dashboard-balance-value">
                            {formatPoints(summary?.balance ?? summary?.total_points)}
                        </div>
                        <div className="dashboard-balance-unit">LOYALTY POINTS</div>
                    </div>
                    <div className="dashboard-balance-side">
                        <div className="dashboard-balance-stat">
                            <span className="dashboard-balance-stat-label">Lifetime earned</span>
                            <span className="dashboard-balance-stat-value">
                                {formatPoints(summary?.total_earned ?? summary?.total_points)}
                            </span>
                        </div>
                        <div className="dashboard-balance-stat">
                            <span className="dashboard-balance-stat-label">Tier</span>
                            <span className="dashboard-balance-stat-value">
                                {(summary?.tier_name ?? 'Core Fan').toUpperCase()}
                            </span>
                        </div>
                        <div className="dashboard-balance-stat">
                            <span className="dashboard-balance-stat-label">Rank</span>
                            <span className="dashboard-balance-stat-value">#{summary?.rank ?? 'N/A'}</span>
                        </div>
                    </div>
                </section>
 

                <div className="dashboard-grid">
                    <section className="dashboard-panel">
                        <div className="section-eye">Last 7 Days</div>
                        <div className="section-title">DAILY EARNINGS</div>
                        <div className="dashboard-bars" aria-label="Points earned over the last 7 days">
                            {dailySeries.map((day) => (
                                <div key={day.date} className="dashboard-bar-col">
                                    <div className="dashboard-bar-track">
                                        <div
                                            className="dashboard-bar-fill"
                                            style={{ height: `${Math.max(6, (day.points / maxDayPoints) * 100)}%` }}
                                            title={`${day.points} pts`}
                                        />
                                    </div>
                                    <div className="dashboard-bar-label">{day.label}</div>
                                    <div className="dashboard-bar-value">{day.points}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="dashboard-panel">
                        <div className="section-eye">Breakdown</div>
                        <div className="section-title">BY SOURCE</div>
                        {bySource.length === 0 ? (
                            <div className="staff-empty-state">No earnings yet. Claim daily points or finish a task.</div>
                        ) : (
                            <div className="dashboard-source-list">
                                {bySource.map((row) => (
                                    <div key={row.source} className="dashboard-source-row">
                                        <div className="dashboard-source-meta">
                                            <span className="dashboard-source-label">{row.label}</span>
                                            <span className="dashboard-source-count">{row.count} tx</span>
                                        </div>
                                        <div className="dashboard-source-track">
                                            <div
                                                className="dashboard-source-fill"
                                                style={{ width: `${(row.total / maxSourceTotal) * 100}%` }}
                                            />
                                        </div>
                                        <div className="dashboard-source-total">+{formatPoints(row.total)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <section className="dashboard-panel dashboard-ledger">
                    <div className="section-eye">Activity</div>
                    <div className="section-title">RECENT EARNINGS</div>
                    {recentTransactions.length === 0 ? (
                        <div className="staff-empty-state">Your point history will show up here.</div>
                    ) : (
                        <div className="dashboard-tx-list">
                            <div className="dashboard-tx-head">
                                <div>Source</div>
                                <div>When</div>
                                <div>Amount</div>
                            </div>
                            {recentTransactions.map((tx) => (
                                <div key={tx.id} className="dashboard-tx-row">
                                    <div>
                                        <div className="dashboard-tx-label">{tx.label}</div>
                                        <div className="dashboard-tx-reason">{tx.reason || 'N/A'}</div>
                                    </div>
                                    <div className="dashboard-tx-when">{formatWhen(tx.created_at)}</div>
                                    <div className={`dashboard-tx-amount${tx.amount >= 0 ? ' positive' : ' negative'}`}>
                                        {tx.amount >= 0 ? '+' : ''}
                                        {formatPoints(tx.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="dashboard-quick-links">
                    <Link href="/daily-claim" className="share-btn primary">
                        Daily Claim
                    </Link>
                    <Link href="/tasks" className="share-btn">
                        Tasks
                    </Link>
                    <Link href="/passport" className="share-btn">
                        Passport
                    </Link>
                </section>
            </div>
        </FanLayout>
    );
}
