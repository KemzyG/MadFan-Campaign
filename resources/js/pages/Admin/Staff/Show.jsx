import { adminBadgeClass, adminBadgeVariant } from '@/lib/admin-badge';
import { AdminFilterBar } from '@/lib/admin-filter-bar';
import { AdminPageHeader } from '@/lib/admin-page-header';
import { AdminPagination } from '@/lib/admin-pagination';
import { AdminTable } from '@/lib/admin-table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';
import { formatDateTime, formatNumber } from '../../../lib/format';

function MetricCard({ label, value }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
                <div className="mt-2 text-2xl font-semibold">{value}</div>
            </CardContent>
        </Card>
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
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="font-medium">{task.name}</div>
                        <div className="text-xs text-muted-foreground">
                            {task.code} · {task.assignment_label}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant={adminBadgeVariant(statusVariant(task.status))} className={adminBadgeClass(statusVariant(task.status))}>{task.status?.replaceAll('_', ' ') ?? '—'}</Badge>
                        <Badge variant={adminBadgeVariant(task.is_active ? 'success' : 'default')} className={adminBadgeClass(task.is_active ? 'success' : 'default')}>
                            {task.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>{task.task_type ?? 'Staff task'} · {task.points} pts</span>
                    {task.points_awarded > 0 && <span>Awarded {task.points_awarded} pts</span>}
                    {task.verification_status && task.verification_status !== 'not_required' && (
                        <span>Verification: {task.verification_status}</span>
                    )}
                </div>
                {task.last_activity_at && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        Last activity {formatDateTime(task.last_activity_at)}
                    </div>
                )}
                {task.failure_reason && (
                    <div className="mt-2 text-xs text-destructive">{task.failure_reason}</div>
                )}
            </CardContent>
        </Card>
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
            <AdminPageHeader
                title={member.name}
                description={`${staffProfile?.position_label ?? 'Staff'} · ${member.fan_id}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={adminPath(page.props, 'staff')}>Back to staff</Link>
                        </Button>
                        {canImpersonate && (
                            <Button
                                type="button"
                                variant="outline"
                                className="border-amber-500/30 text-amber-700 dark:text-amber-300"
                                onClick={() => router.post(adminPath(page.props, `impersonate/${member.id}`))}
                            >
                                View as
                            </Button>
                        )}
                        <Button type="button" onClick={() => setEditOpen(true)}>
                            Edit staff
                        </Button>
                        <Button type="button" variant="outline" className="text-destructive" onClick={removeStaff} disabled={loading}>
                            Remove staff
                        </Button>
                    </div>
                }
            />

            {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

            <Card className="mb-8">
                <CardContent className="grid gap-4 p-6 lg:grid-cols-4">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Position</div>
                        <div className="mt-1 text-lg font-medium">{staffProfile?.position_label ?? '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Status</div>
                        <div className="mt-1">
                            <Badge variant={adminBadgeVariant(staffProfile?.status === 'active' ? 'success' : 'default')} className={adminBadgeClass(staffProfile?.status === 'active' ? 'success' : 'default')}>
                                {staffProfile?.status_label ?? '—'}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Assigned</div>
                        <div className="mt-1 text-sm">
                            {staffProfile?.assigned_at ? formatDateTime(staffProfile.assigned_at) : '—'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Assigned by</div>
                        <div className="mt-1 text-sm">{staffProfile?.assigned_by?.name ?? '—'}</div>
                    </div>
                    <div className="lg:col-span-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Description</div>
                        <div className="mt-1 text-sm text-muted-foreground">{staffProfile?.position_description ?? '—'}</div>
                    </div>
                </CardContent>
            </Card>

            <section className="mb-8">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">Performance</h2>
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
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                        Direct assignments
                    </h2>
                    <div className="space-y-3">
                        {directAssignments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No tasks assigned directly to this staff member.</p>
                        ) : (
                            directAssignments.map((task) => <AssignmentCard key={task.id} task={task} />)
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                        Position / shared tasks
                    </h2>
                    <div className="space-y-3">
                        {sharedAssignments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No position-wide staff tasks for this role.</p>
                        ) : (
                            sharedAssignments.map((task) => <AssignmentCard key={task.id} task={task} />)
                        )}
                    </div>
                </section>
            </div>

            <section className="mb-8">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                    Activity timeline
                </h2>
                <Card>
                    <CardContent className="p-0">
                        {activityTimeline.length === 0 ? (
                            <p className="p-6 text-sm text-muted-foreground">
                                No staff activity yet. Once this member works on assigned tasks, progress appears here.
                            </p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {activityTimeline.map((item, index) => (
                                    <li key={`${item.event}-${item.occurred_at}-${index}`} className="flex gap-4 p-4">
                                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium">{item.title}</span>
                                                {item.status && (
                                                    <Badge variant={adminBadgeVariant(statusVariant(item.status))} className={adminBadgeClass(statusVariant(item.status))}>
                                                        {String(item.status).replaceAll('_', ' ')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {item.occurred_at ? formatDateTime(item.occurred_at) : '—'}
                                                {item.meta?.task_code ? ` · ${item.meta.task_code}` : ''}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </section>

            <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">Staff leaderboard</h2>
                <Card>
                    <CardContent className="p-0">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fan</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Position</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((entry) => (
                                    <tr
                                        key={entry.user_id}
                                        className={`border-b border-border ${entry.user_id === member.id ? 'bg-primary/5' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            {entry.user_id === member.id ? (
                                                <span className="font-medium text-primary">{entry.name}</span>
                                            ) : (
                                                <Link href={adminPath(page.props, `staff/${entry.user_id}`)} className="text-primary hover:underline">
                                                    {entry.name}
                                                </Link>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{entry.staff_position?.replace('_', ' ') ?? '—'}</td>
                                        <td className="px-4 py-3">{entry.performance_score}</td>
                                        <td className="px-4 py-3">{formatNumber(entry.total_points)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </section>

            <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Edit staff member</DialogTitle></DialogHeader>
                <form onSubmit={updateStaff} className="space-y-3">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Field ><FieldLabel>Position</FieldLabel>
                        <NativeSelect className="w-full"
                            value={form.staff_position}
                            onChange={(e) => setForm({ ...form, staff_position: e.target.value })}
                            required
                        >
                            {staffPositions.map((position) => (
                                <NativeSelectOption key={position.value} value={position.value}>
                                    {position.label}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </Field>
                    <Field ><FieldLabel>Status</FieldLabel>
                        <NativeSelect className="w-full"
                            value={form.staff_status}
                            onChange={(e) => setForm({ ...form, staff_status: e.target.value })}
                        >
                            {staffStatuses.map((status) => (
                                <NativeSelectOption key={status.value} value={status.value}>
                                    {status.label}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </Field>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </DialogContent></Dialog>
        </AdminLayout>
    );
}
