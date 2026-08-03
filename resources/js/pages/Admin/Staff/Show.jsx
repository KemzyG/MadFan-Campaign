import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import Badge from '../../../Components/Badge';
import PageHeader from '../../../Components/PageHeader';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';
import { formatDateTime, formatNumber } from '../../../lib/format';

function MetricCard({ label, value }) {
    return (
        <div className="rounded-xl border border-white/10 bg-surface-800/60 p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
        </div>
    );
}

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
        case 'not_started':
            return 'default';
        default:
            return 'default';
    }
}

function AssignmentCard({ task }) {
    return (
        <div className="rounded-xl border border-white/10 bg-surface-800/50 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-medium text-white">{task.name}</div>
                    <div className="text-xs text-zinc-500">
                        {task.code} · {task.assignment_label}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Badge variant={statusVariant(task.status)}>{task.status?.replaceAll('_', ' ') ?? '—'}</Badge>
                    <Badge variant={task.is_active ? 'success' : 'default'}>
                        {task.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-400">
                <span>{task.task_type ?? 'Staff task'} · {task.points} pts</span>
                {task.points_awarded > 0 && <span>Awarded {task.points_awarded} pts</span>}
                {task.verification_status && task.verification_status !== 'not_required' && (
                    <span>Verification: {task.verification_status}</span>
                )}
            </div>
            {task.last_activity_at && (
                <div className="mt-2 text-xs text-zinc-500">
                    Last activity {formatDateTime(task.last_activity_at)}
                </div>
            )}
            {task.failure_reason && (
                <div className="mt-2 text-xs text-red-300">{task.failure_reason}</div>
            )}
        </div>
    );
}

export default function StaffShow({
    member,
    staff_profile: staffProfile,
    performance,
    tracked_assignments: trackedAssignments = [],
    activity_timeline: activityTimeline = [],
    leaderboard = [],
    staffPositions = [],
    staffStatuses = [],
    can_impersonate: canImpersonate = false,
}) {
    const page = usePage();
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({
        staff_position: staffProfile?.position ?? '',
        staff_status: staffProfile?.status ?? 'active',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const directAssignments = trackedAssignments.filter((task) => task.assignment_type === 'direct');
    const sharedAssignments = trackedAssignments.filter((task) => task.assignment_type !== 'direct');
    const completedCount = trackedAssignments.filter((task) =>
        ['claimed', 'completed'].includes(task.status),
    ).length;
    const inProgressCount = trackedAssignments.filter((task) =>
        ['pending', 'confirmed'].includes(task.status),
    ).length;

    async function updateStaff(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await adminApi(`/staff/${member.id}`, { method: 'PUT', body: form });
            setEditOpen(false);
            router.reload();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function removeStaff() {
        if (!confirm('Remove staff position from this member?')) return;
        setLoading(true);
        setError('');
        try {
            await adminApi(`/staff/${member.id}`, { method: 'DELETE' });
            router.visit(adminPath(page.props, 'staff'));
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }

    return (
        <AdminLayout title={member.name}>
            <PageHeader
                title={member.name}
                description={`${staffProfile?.position_label ?? 'Staff'} · ${member.fan_id}`}
                actions={
                    <div className="flex gap-2">
                        <Link href={adminPath(page.props, 'staff')} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">
                            Back to staff
                        </Link>
                        {canImpersonate && (
                            <button
                                type="button"
                                onClick={() => router.post(adminPath(page.props, `impersonate/${member.id}`))}
                                className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/20"
                            >
                                View as
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setEditOpen(true)}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                        >
                            Edit staff
                        </button>
                        <button
                            type="button"
                            onClick={removeStaff}
                            disabled={loading}
                            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300"
                        >
                            Remove staff
                        </button>
                    </div>
                }
            />

            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

            <section className="mb-8 grid gap-4 rounded-2xl border border-white/10 bg-surface-800/50 p-6 lg:grid-cols-4">
                <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Position</div>
                    <div className="mt-1 text-lg font-medium text-white">{staffProfile?.position_label ?? '—'}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Status</div>
                    <div className="mt-1">
                        <Badge variant={staffProfile?.status === 'active' ? 'success' : 'default'}>
                            {staffProfile?.status_label ?? '—'}
                        </Badge>
                    </div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Assigned</div>
                    <div className="mt-1 text-sm text-zinc-200">
                        {staffProfile?.assigned_at ? formatDateTime(staffProfile.assigned_at) : '—'}
                    </div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Assigned by</div>
                    <div className="mt-1 text-sm text-zinc-200">{staffProfile?.assigned_by?.name ?? '—'}</div>
                </div>
                <div className="lg:col-span-4">
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Description</div>
                    <div className="mt-1 text-sm text-zinc-300">{staffProfile?.position_description ?? '—'}</div>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">Performance</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Performance score" value={formatNumber(performance?.performance_score ?? 0)} />
                    <MetricCard label="Staff rank" value={`#${performance?.staff_rank ?? '—'}`} />
                    <MetricCard label="Assignments done" value={`${completedCount}/${trackedAssignments.length}`} />
                    <MetricCard label="Assignments in progress" value={inProgressCount} />
                    <MetricCard label="Total points" value={formatNumber(performance?.total_points ?? 0)} />
                    <MetricCard label="Referrals" value={performance?.total_referrals ?? 0} />
                    <MetricCard label="Completed tasks" value={performance?.completed_tasks ?? 0} />
                    <MetricCard label="Failed tasks" value={performance?.failed_tasks ?? 0} />
                    <MetricCard label="Staff tasks done" value={performance?.staff_completed_tasks ?? 0} />
                    <MetricCard label="Daily claims today" value={performance?.daily_claims_today ?? 0} />
                    <MetricCard label="Weekly claims" value={performance?.weekly_claims ?? 0} />
                    <MetricCard label="Current streak" value={`${performance?.current_streak_days ?? 0} days`} />
                </div>
            </section>

            <div className="mb-8 grid gap-8 lg:grid-cols-2">
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
                        Direct assignments
                    </h2>
                    <div className="space-y-3">
                        {directAssignments.length === 0 ? (
                            <p className="text-sm text-zinc-500">No tasks assigned directly to this staff member.</p>
                        ) : (
                            directAssignments.map((task) => <AssignmentCard key={task.id} task={task} />)
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
                        Position / shared tasks
                    </h2>
                    <div className="space-y-3">
                        {sharedAssignments.length === 0 ? (
                            <p className="text-sm text-zinc-500">No position-wide staff tasks for this role.</p>
                        ) : (
                            sharedAssignments.map((task) => <AssignmentCard key={task.id} task={task} />)
                        )}
                    </div>
                </section>
            </div>

            <section className="mb-8">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
                    Activity timeline
                </h2>
                <div className="rounded-2xl border border-white/10 bg-surface-800/50">
                    {activityTimeline.length === 0 ? (
                        <p className="p-6 text-sm text-zinc-500">
                            No staff activity yet. Once this member works on assigned tasks, progress appears here.
                        </p>
                    ) : (
                        <ul className="divide-y divide-white/5">
                            {activityTimeline.map((item, index) => (
                                <li key={`${item.event}-${item.occurred_at}-${index}`} className="flex gap-4 p-4">
                                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-400" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium text-white">{item.title}</span>
                                            {item.status && (
                                                <Badge variant={statusVariant(item.status)}>
                                                    {String(item.status).replaceAll('_', ' ')}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            {item.occurred_at ? formatDateTime(item.occurred_at) : '—'}
                                            {item.meta?.task_code ? ` · ${item.meta.task_code}` : ''}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">Staff leaderboard</h2>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-800/50">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Fan</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Position</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Score</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry) => (
                                <tr
                                    key={entry.user_id}
                                    className={`border-b border-white/5 ${entry.user_id === member.id ? 'bg-brand-500/10' : ''}`}
                                >
                                    <td className="px-4 py-3 text-zinc-300">
                                        {entry.user_id === member.id ? (
                                            <span className="font-medium text-brand-300">{entry.name}</span>
                                        ) : (
                                            <Link href={adminPath(page.props, `staff/${entry.user_id}`)} className="hover:text-brand-300">
                                                {entry.name}
                                            </Link>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400">{entry.staff_position?.replace('_', ' ') ?? '—'}</td>
                                    <td className="px-4 py-3 text-zinc-300">{entry.performance_score}</td>
                                    <td className="px-4 py-3 text-zinc-300">{formatNumber(entry.total_points)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {editOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <form onSubmit={updateStaff} className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-800 p-6">
                        <h3 className="text-lg font-semibold text-white">Edit staff member</h3>
                        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                        <div className="mt-4 space-y-3">
                            <select
                                value={form.staff_position}
                                onChange={(e) => setForm({ ...form, staff_position: e.target.value })}
                                className="w-full rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm"
                                required
                            >
                                {staffPositions.map((position) => (
                                    <option key={position.value} value={position.value}>
                                        {position.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={form.staff_status}
                                onChange={(e) => setForm({ ...form, staff_status: e.target.value })}
                                className="w-full rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm"
                            >
                                {staffStatuses.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={() => setEditOpen(false)} className="text-sm text-zinc-400">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900">
                                Save changes
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
