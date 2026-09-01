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
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';
import { formatDateTime, formatNumber } from '../../../lib/format';

function MetricCard({ label, value, hint }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="mt-2 text-2xl font-semibold">{value}</div>
                {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
            </CardContent>
        </Card>
    );
}

function statusVariant(status) {
    switch (status) {
        case 'claimed':
        case 'completed':
        case 'rewarded':
        case 'active':
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

export default function UserShow({
    profile,
    analytics,
    staff_profile: staffProfile,
    loyaltyTiers = [],
    staffPositions = [],
    can_edit: canEdit = false,
    can_manage_staff: canManageStaff = false,
    can_delete: canDelete = false,
    can_impersonate: canImpersonate = false,
}) {
    const page = usePage();
    const base = adminPath(page.props);
    const stats = analytics?.stats ?? {};
    const [editing, setEditing] = useState(false);
    const [staffError, setStaffError] = useState('');
    const [staffLoading, setStaffLoading] = useState(false);
    const [staffForm, setStaffForm] = useState({
        staff_position: staffProfile?.position ?? '',
        staff_status: staffProfile?.status ?? 'active',
    });

    const form = useForm({
        name: profile.name ?? '',
        email: profile.email ?? '',
        username: profile.username ?? '',
        handle: profile.handle ?? '',
        country: profile.country ?? '',
        league: profile.league ?? '',
        club: profile.club ?? '',
        loyalty_tier_id: profile.loyalty_tier_id ?? '',
        total_points: profile.total_points ?? 0,
        password: '',
    });

    function submitProfile(e) {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            loyalty_tier_id: data.loyalty_tier_id || null,
            password: data.password || undefined,
        })).put(adminPath(page.props, `users/${profile.id}`), {
            preserveScroll: true,
            onSuccess: () => {
                setEditing(false);
                form.setData('password', '');
            },
        });
    }

    async function saveStaff(e) {
        e.preventDefault();
        setStaffLoading(true);
        setStaffError('');
        try {
            const method = profile.is_staff ? 'PUT' : 'POST';
            await adminApi(`/users/${profile.id}/staff-position`, {
                method,
                body: staffForm,
            });
            router.reload();
        } catch (err) {
            setStaffError(err.message);
        } finally {
            setStaffLoading(false);
        }
    }

    async function removeStaff() {
        if (!confirm('Remove staff position from this user?')) return;
        setStaffLoading(true);
        setStaffError('');
        try {
            await adminApi(`/users/${profile.id}/staff-position`, { method: 'DELETE' });
            router.reload();
        } catch (err) {
            setStaffError(err.message);
        } finally {
            setStaffLoading(false);
        }
    }

    async function deleteUser() {
        if (!confirm('Delete this user permanently?')) return;
        await adminApi(`/users/${profile.id}`, { method: 'DELETE' });
        router.visit(adminPath(page.props, 'users'));
    }

    return (
        <AdminLayout title={profile.name}>
            <AdminPageHeader
                title={profile.name}
                description={`${profile.fan_id} · ${profile.email}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={adminPath(page.props, 'users')}>Back to users</Link>
                        </Button>
                        {canImpersonate && (
                            <Button
                                type="button"
                                variant="outline"
                                className="border-amber-500/30 text-amber-700 dark:text-amber-300"
                                onClick={() => router.post(adminPath(page.props, `impersonate/${profile.id}`))}
                            >
                                View as
                            </Button>
                        )}
                        {canEdit && (
                            <Button type="button" onClick={() => setEditing((value) => !value)}>
                                {editing ? 'Cancel edit' : 'Edit profile'}
                            </Button>
                        )}
                        {canDelete && (
                            <Button type="button" variant="outline" className="text-destructive" onClick={deleteUser}>
                                Delete
                            </Button>
                        )}
                    </div>
                }
            />

            <Card className="mb-8">
                <CardContent className="grid gap-4 p-6 lg:grid-cols-4">
                    <div className="flex items-center gap-3 lg:col-span-2">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-3xl">
                            {profile.avatar_emoji || '⚽'}
                        </div>
                        <div>
                            <div className="text-lg font-semibold">{profile.name}</div>
                            <div className="text-sm text-muted-foreground">
                                @{profile.username || '—'} · {profile.handle || 'No X handle'}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {profile.loyalty_tier?.name && (
                                    <Badge>{profile.loyalty_tier.name}</Badge>
                                )}
                                {profile.is_staff && (
                                    <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">{staffProfile?.position_label ?? 'Staff'}</Badge>
                                )}
                                {profile.roles?.map((role) => (
                                    <Badge key={role}>{role}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Club</div>
                        <div className="mt-1 text-sm">{profile.club || '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Last login</div>
                        <div className="mt-1 text-sm">
                            {profile.last_login_at ? formatDateTime(profile.last_login_at) : 'Never'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Country / league</div>
                        <div className="mt-1 text-sm">
                            {[profile.country, profile.league].filter(Boolean).join(' · ') || '—'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Joined</div>
                        <div className="mt-1 text-sm">
                            {profile.created_at ? formatDateTime(profile.created_at) : '—'}
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Connected socials</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                            {(profile.social_accounts ?? []).length === 0 ? (
                                <span className="text-sm text-muted-foreground">None connected</span>
                            ) : (
                                profile.social_accounts.map((account) => (
                                    <Badge key={`${account.platform}-${account.username}`} variant="brand">
                                        {account.platform}: {account.username || 'connected'}
                                    </Badge>
                                ))
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <section className="mb-8">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                    Analytics & stats
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Total points" value={formatNumber(stats.total_points ?? 0)} />
                    <MetricCard label="Points earned" value={formatNumber(stats.points_earned ?? 0)} />
                    <MetricCard label="Points spent" value={formatNumber(stats.points_spent ?? 0)} />
                    <MetricCard label="Referrals" value={stats.referral_count ?? 0} />
                    <MetricCard
                        label="Current streak"
                        value={`${stats.current_streak_days ?? 0} days`}
                        hint={`Best ${stats.best_streak_days ?? 0} days`}
                    />
                    <MetricCard label="Completed tasks" value={stats.completed_tasks ?? 0} />
                    <MetricCard label="Pending tasks" value={stats.pending_tasks ?? 0} />
                    <MetricCard label="Failed tasks" value={stats.failed_tasks ?? 0} />
                    <MetricCard
                        label="Daily claims"
                        value={stats.daily_claims_total ?? 0}
                        hint={`${stats.daily_claims_today ?? 0} today`}
                    />
                </div>
            </section>

            {(analytics?.points_by_source?.length ?? 0) > 0 && (
                <section className="mb-8">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                        Points by source
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {analytics.points_by_source.map((row) => (
                            <Card key={row.source_type}>
                                <CardContent className="px-4 py-3">
                                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                                        {String(row.source_type).replaceAll('_', ' ')}
                                    </div>
                                    <div className="mt-1 text-lg font-semibold">
                                        {formatNumber(row.total)}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {canEdit && editing && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider">Edit profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitProfile} className="grid gap-4 sm:grid-cols-2">
                            <Field  error={form.errors.name}><FieldLabel>Name</FieldLabel>
                                <Input
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    required
                                />
                            </Field>
                            <Field  error={form.errors.email}><FieldLabel>Email</FieldLabel>
                                <Input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    required
                                />
                            </Field>
                            <Field  error={form.errors.username}><FieldLabel>Username</FieldLabel>
                                <Input
                                    value={form.data.username}
                                    onChange={(e) => form.setData('username', e.target.value)}
                                />
                            </Field>
                            <Field  error={form.errors.handle}><FieldLabel>Handle</FieldLabel>
                                <Input
                                    value={form.data.handle}
                                    onChange={(e) => form.setData('handle', e.target.value)}
                                />
                            </Field>
                            <Field  error={form.errors.country}><FieldLabel>Country</FieldLabel>
                                <Input
                                    value={form.data.country}
                                    onChange={(e) => form.setData('country', e.target.value)}
                                />
                            </Field>
                            <Field  error={form.errors.league}><FieldLabel>League</FieldLabel>
                                <Input
                                    value={form.data.league}
                                    onChange={(e) => form.setData('league', e.target.value)}
                                />
                            </Field>
                            <Field  error={form.errors.club}><FieldLabel>Club</FieldLabel>
                                <Input
                                    value={form.data.club}
                                    onChange={(e) => form.setData('club', e.target.value)}
                                />
                            </Field>
                            <Field  error={form.errors.loyalty_tier_id}><FieldLabel>Loyalty tier</FieldLabel>
                                <NativeSelect className="w-full"
                                    value={form.data.loyalty_tier_id ?? ''}
                                    onChange={(e) => form.setData('loyalty_tier_id', e.target.value)}
                                >
                                    <NativeSelectOption value="">No tier</NativeSelectOption>
                                    {loyaltyTiers.map((tier) => (
                                        <NativeSelectOption key={tier.id} value={tier.id}>
                                            {tier.name}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </Field>
                            <Field  error={form.errors.total_points}><FieldLabel>Total points</FieldLabel>
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.data.total_points}
                                    onChange={(e) => form.setData('total_points', e.target.value)}
                                />
                            </Field>
                            <Field  hint="Leave blank to keep current password." error={form.errors.password}><FieldLabel>New password</FieldLabel>
                                <Input
                                    type="password"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                    autoComplete="new-password"
                                />
                            </Field>
                            <div className="flex justify-end gap-2 sm:col-span-2">
                                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    Save changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {canManageStaff && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider">Staff assignment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {staffError && <p className="mb-3 text-sm text-destructive">{staffError}</p>}
                        <div className="mb-4 grid gap-3 sm:grid-cols-3">
                            <div>
                                <div className="text-xs text-muted-foreground">Position</div>
                                <div className="text-sm">{staffProfile?.position_label ?? 'Regular fan'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Status</div>
                                <div className="text-sm">{staffProfile?.status_label ?? '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Assigned by</div>
                                <div className="text-sm">{staffProfile?.assigned_by?.name ?? '—'}</div>
                            </div>
                        </div>
                        <form onSubmit={saveStaff} className="grid gap-3 sm:grid-cols-2">
                            <NativeSelect className="w-full"
                                value={staffForm.staff_position}
                                onChange={(e) => setStaffForm({ ...staffForm, staff_position: e.target.value })}
                                required
                            >
                                <NativeSelectOption value="">Select staff position</NativeSelectOption>
                                {staffPositions.map((position) => (
                                    <NativeSelectOption key={position.value} value={position.value}>
                                        {position.label}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                            <NativeSelect className="w-full"
                                value={staffForm.staff_status}
                                onChange={(e) => setStaffForm({ ...staffForm, staff_status: e.target.value })}
                            >
                                <NativeSelectOption value="active">Active</NativeSelectOption>
                                <NativeSelectOption value="inactive">Inactive</NativeSelectOption>
                            </NativeSelect>
                            <div className="flex gap-2 sm:col-span-2">
                                <Button type="submit" disabled={staffLoading}>
                                    {profile.is_staff ? 'Update staff' : 'Assign staff'}
                                </Button>
                                {profile.is_staff && (
                                    <Button type="button" variant="outline" className="text-destructive" onClick={removeStaff} disabled={staffLoading}>
                                        Remove staff
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-8 lg:grid-cols-2">
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                        Recent transactions
                    </h2>
                    <Card>
                        <CardContent className="p-0">
                            {(analytics?.recent_transactions ?? []).length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground">No point transactions yet.</p>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {analytics.recent_transactions.map((tx) => (
                                        <li key={tx.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                            <div>
                                                <div className="text-sm">{tx.reason || tx.source_type}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {tx.created_at ? formatDateTime(tx.created_at) : '—'}
                                                </div>
                                            </div>
                                            <div className={`text-sm font-medium ${tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                                                {tx.amount >= 0 ? '+' : ''}
                                                {formatNumber(tx.amount)}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                        Recent task progress
                    </h2>
                    <Card>
                        <CardContent className="p-0">
                            {(analytics?.recent_tasks ?? []).length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground">No task activity yet.</p>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {analytics.recent_tasks.map((task) => (
                                        <li key={task.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                            <div>
                                                <div className="text-sm">{task.task_name || 'Task'}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {task.task_code} · {task.updated_at ? formatDateTime(task.updated_at) : '—'}
                                                </div>
                                            </div>
                                            <Badge variant={adminBadgeVariant(statusVariant(task.status))} className={adminBadgeClass(statusVariant(task.status))}>
                                                {String(task.status).replaceAll('_', ' ')}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                        Daily claims
                    </h2>
                    <Card>
                        <CardContent className="p-0">
                            {(analytics?.recent_claims ?? []).length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground">No daily claims yet.</p>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {analytics.recent_claims.map((claim) => (
                                        <li key={claim.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                            <div>
                                                <div className="text-sm">
                                                    Day {claim.streak_day_number ?? '—'} · ×{claim.multiplier ?? 1}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {claim.claimed_at ? formatDateTime(claim.claimed_at) : claim.claim_date}
                                                </div>
                                            </div>
                                            <div className="text-sm text-emerald-600 dark:text-emerald-400">+{formatNumber(claim.points_awarded)}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
                        Referrals made
                    </h2>
                    <Card>
                        <CardContent className="p-0">
                            {(analytics?.recent_referrals ?? []).length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground">No referrals yet.</p>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {analytics.recent_referrals.map((referral) => (
                                        <li key={referral.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                            <div>
                                                <div className="text-sm">{referral.referred_name || 'Fan'}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {referral.referred_fan_id} ·{' '}
                                                    {referral.created_at ? formatDateTime(referral.created_at) : '—'}
                                                </div>
                                            </div>
                                            <Badge variant={adminBadgeVariant(statusVariant(referral.status))} className={adminBadgeClass(statusVariant(referral.status))}>{referral.status}</Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AdminLayout>
    );
}
