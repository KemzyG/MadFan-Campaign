import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import MiniChart from '../../Components/MiniChart';
import StatCard from '../../Components/StatCard';
import Badge from '../../Components/Badge';
import { formatDateTime, formatNumber } from '../../lib/format';
import { adminPath } from '../../lib/adminPath';
import { WORKSPACE_ACCENTS } from '../../admin/roleWorkspaces';

const FOCUS_LINKS = {
    dashboard: { label: 'Dashboard', path: '' },
    users: { label: 'Users', path: 'users' },
    staff: { label: 'Staff', path: 'staff' },
    tasks: { label: 'Tasks', path: 'tasks' },
    'task-reviews': { label: 'Task reviews', path: 'task-reviews' },
    seasons: { label: 'Seasons', path: 'seasons' },
    'loyalty-tiers': { label: 'Loyalty tiers', path: 'loyalty-tiers' },
    referrals: { label: 'Referrals', path: 'referrals' },
    'point-transactions': { label: 'Point transactions', path: 'point-transactions' },
    'activity-logs': { label: 'Activity logs', path: 'activity-logs' },
    settings: { label: 'Settings', path: 'settings' },
    'system-logs': { label: 'System logs', path: 'system-logs' },
};

function statusVariant(status) {
    switch (status) {
        case 'claimed':
        case 'completed':
            return 'success';
        case 'confirmed':
        case 'pending':
            return 'brand';
        case 'failed':
        case 'rejected':
            return 'danger';
        default:
            return 'default';
    }
}

function PlatformDashboard({
    stats,
    points_series: pointsSeries,
    daily_claims_series: dailyClaimsSeries,
    points_by_source: pointsBySource,
    source_type_labels: sourceTypeLabels,
    top_users: topUsers,
    recent_activity: recentActivity,
    workspace,
    accent,
    focus,
    page,
}) {
    const sourceEntries = Object.entries(pointsBySource ?? {});

    return (
        <>
            <div className={`mb-6 rounded-2xl border border-white/10 p-5 ${accent.soft}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${accent.text}`}>
                    {workspace?.label ?? 'Admin Console'}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">{workspace?.job}</h2>
                <p className="mt-1 text-sm text-zinc-400">{workspace?.tagline}</p>
                {focus.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {focus.map((item) => (
                            <Link
                                key={item.path}
                                href={adminPath(page.props, item.path)}
                                className={`rounded-lg border border-white/10 bg-surface-900/40 px-3 py-1.5 text-xs font-medium ${accent.text} transition hover:bg-white/5`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total fans" value={stats?.total_users} hint="Registered users" />
                <StatCard
                    label="New today"
                    value={stats?.new_users_today}
                    hint={`${stats?.new_users_this_week ?? 0} this week`}
                    accent="emerald"
                />
                <StatCard
                    label="Points distributed"
                    value={stats?.total_points_distributed}
                    hint={`${formatNumber(stats?.shootout_points_distributed ?? 0)} from penalty shootout`}
                    accent="sky"
                />
                <StatCard
                    label="Daily claims today"
                    value={stats?.daily_claims_today}
                    hint={`${stats?.task_completion_rate ?? 0}% task completion`}
                    accent="violet"
                />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-surface-800/50 p-5">
                    <h3 className="text-sm font-semibold text-white">Points awarded (14 days)</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                        Includes tasks, claims, referrals, bonuses, and penalty shootout.
                    </p>
                    <MiniChart labels={pointsSeries?.labels} values={pointsSeries?.values} color="#38bdf8" />
                </div>
                <div className="rounded-2xl border border-white/5 bg-surface-800/50 p-5">
                    <h3 className="text-sm font-semibold text-white">Daily claims (14 days)</h3>
                    <MiniChart
                        labels={dailyClaimsSeries?.labels}
                        values={dailyClaimsSeries?.values}
                        color="#e8ff00"
                    />
                </div>
            </div>

            {sourceEntries.length > 0 && (
                <div className="mt-6 rounded-2xl border border-white/5 bg-surface-800/50 p-5">
                    <h3 className="text-sm font-semibold text-white">Points by source (30 days)</h3>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {sourceEntries.map(([source, amount]) => (
                            <li
                                key={source}
                                className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2"
                            >
                                <span className="text-sm text-zinc-300">
                                    {sourceTypeLabels?.[source] ?? source}
                                </span>
                                <span className="text-sm font-semibold text-brand-300">
                                    {formatNumber(amount)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-surface-800/50 p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Top fans</h3>
                        <Badge variant="brand">{stats?.active_tasks ?? 0} active tasks</Badge>
                    </div>
                    <ul className="space-y-3">
                        {(topUsers ?? []).map((user, index) => (
                            <li
                                key={user.id}
                                className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-200">{user.name}</p>
                                        <p className="text-xs text-zinc-500">@{user.username ?? user.fan_id}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-brand-300">
                                    {formatNumber(user.total_points)} pts
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-2xl border border-white/5 bg-surface-800/50 p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Recent activity</h3>
                        <Badge variant="warning">{stats?.pending_referrals ?? 0} pending referrals</Badge>
                    </div>
                    <ul className="space-y-3">
                        {(recentActivity ?? []).map((log) => (
                            <li key={log.id} className="border-b border-white/5 pb-3 last:border-0">
                                <p className="text-sm text-zinc-300">{log.description}</p>
                                <p className="mt-1 text-xs text-zinc-500">
                                    {log.user?.name ?? 'System'} · {formatDateTime(log.created_at)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}

function PersonalDashboard({
    stats,
    staff_profile: staffProfile,
    tracked_assignments: trackedAssignments = [],
    activity_timeline: activityTimeline = [],
    workspace,
    accent,
    focus,
    page,
}) {
    return (
        <>
            <div className={`mb-6 rounded-2xl border border-white/10 p-5 ${accent.soft}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${accent.text}`}>
                    {staffProfile?.position_label ?? workspace?.label ?? 'Your desk'}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                    {staffProfile?.name ? `${staffProfile.name}'s performance` : 'Your performance'}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                    Personal stats only — platform-wide analytics stay with admins.
                </p>
                {focus.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {focus.map((item) => (
                            <Link
                                key={item.path}
                                href={adminPath(page.props, item.path)}
                                className={`rounded-lg border border-white/10 bg-surface-900/40 px-3 py-1.5 text-xs font-medium ${accent.text} transition hover:bg-white/5`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Performance score" value={stats?.performance_score} hint={`Rank #${stats?.staff_rank ?? '—'}`} />
                <StatCard label="Total points" value={stats?.total_points} hint={`${stats?.total_referrals ?? 0} referrals`} accent="emerald" />
                <StatCard
                    label="Completed tasks"
                    value={stats?.completed_tasks}
                    hint={`${stats?.staff_completed_tasks ?? 0} staff tasks · ${stats?.pending_tasks ?? 0} pending`}
                    accent="sky"
                />
                <StatCard
                    label="Current streak"
                    value={`${stats?.current_streak_days ?? 0}d`}
                    hint={`Best ${stats?.best_streak_days ?? 0}d · ${stats?.daily_claims_today ?? 0} claims today`}
                    accent="violet"
                />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-surface-800/50 p-5">
                    <h3 className="mb-4 text-sm font-semibold text-white">Your assignments</h3>
                    {(trackedAssignments ?? []).length === 0 ? (
                        <p className="text-sm text-zinc-500">No tracked staff assignments yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {trackedAssignments.slice(0, 8).map((task) => (
                                <li key={task.id} className="rounded-xl bg-white/[0.02] px-3 py-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-zinc-200">{task.name}</p>
                                            <p className="text-xs text-zinc-500">
                                                {task.code} · {task.assignment_label}
                                            </p>
                                        </div>
                                        <Badge variant={statusVariant(task.status)}>
                                            {String(task.status ?? '—').replaceAll('_', ' ')}
                                        </Badge>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="rounded-2xl border border-white/5 bg-surface-800/50 p-5">
                    <h3 className="mb-4 text-sm font-semibold text-white">Recent activity</h3>
                    {(activityTimeline ?? []).length === 0 ? (
                        <p className="text-sm text-zinc-500">No recent activity yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {activityTimeline.slice(0, 8).map((item) => (
                                <li key={`${item.type}-${item.id}`} className="border-b border-white/5 pb-3 last:border-0">
                                    <p className="text-sm text-zinc-300">{item.description ?? item.label ?? item.type}</p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                        {item.occurred_at ? formatDateTime(item.occurred_at) : '—'}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}

export default function Dashboard(props) {
    const page = usePage();
    const workspace = page.props.workspace;
    const accent = WORKSPACE_ACCENTS[workspace?.accent] ?? WORKSPACE_ACCENTS.brand;
    const focus = (workspace?.focus ?? [])
        .map((key) => FOCUS_LINKS[key])
        .filter(Boolean)
        .slice(0, 5);

    const isPlatform = props.dashboard_mode === 'platform';

    return (
        <AdminLayout title="Dashboard">
            {isPlatform ? (
                <PlatformDashboard {...props} workspace={workspace} accent={accent} focus={focus} page={page} />
            ) : (
                <PersonalDashboard {...props} workspace={workspace} accent={accent} focus={focus} page={page} />
            )}
        </AdminLayout>
    );
}
