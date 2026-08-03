import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import Badge from '../../../Components/Badge';
import PageHeader from '../../../Components/PageHeader';
import { FormField, FormInput, FormSelect } from '../../../Components/Admin/FormField';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';
import { formatDateTime, formatNumber } from '../../../lib/format';

function MetricCard({ label, value, hint }) {
    return (
        <div className="rounded-xl border border-white/10 bg-surface-800/60 p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
            {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
        </div>
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
            <PageHeader
                title={profile.name}
                description={`${profile.fan_id} · ${profile.email}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={adminPath(page.props, 'users')}
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
                        >
                            Back to users
                        </Link>
                        {canImpersonate && (
                            <button
                                type="button"
                                onClick={() => router.post(adminPath(page.props, `impersonate/${profile.id}`))}
                                className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/20"
                            >
                                View as
                            </button>
                        )}
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => setEditing((value) => !value)}
                                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                            >
                                {editing ? 'Cancel edit' : 'Edit profile'}
                            </button>
                        )}
                        {canDelete && (
                            <button
                                type="button"
                                onClick={deleteUser}
                                className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                }
            />

            <section className="mb-8 grid gap-4 rounded-2xl border border-white/10 bg-surface-800/50 p-6 lg:grid-cols-4">
                <div className="flex items-center gap-3 lg:col-span-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl">
                        {profile.avatar_emoji || '⚽'}
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-white">{profile.name}</div>
                        <div className="text-sm text-zinc-400">
                            @{profile.username || '—'} · {profile.handle || 'No X handle'}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2">
                            {profile.loyalty_tier?.name && (
                                <Badge variant="brand">{profile.loyalty_tier.name}</Badge>
                            )}
                            {profile.is_staff && (
                                <Badge variant="success">{staffProfile?.position_label ?? 'Staff'}</Badge>
                            )}
                            {profile.roles?.map((role) => (
                                <Badge key={role}>{role}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Club</div>
                    <div className="mt-1 text-sm text-zinc-200">{profile.club || '—'}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Last login</div>
                    <div className="mt-1 text-sm text-zinc-200">
                        {profile.last_login_at ? formatDateTime(profile.last_login_at) : 'Never'}
                    </div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Country / league</div>
                    <div className="mt-1 text-sm text-zinc-200">
                        {[profile.country, profile.league].filter(Boolean).join(' · ') || '—'}
                    </div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Joined</div>
                    <div className="mt-1 text-sm text-zinc-200">
                        {profile.created_at ? formatDateTime(profile.created_at) : '—'}
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Connected socials</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                        {(profile.social_accounts ?? []).length === 0 ? (
                            <span className="text-sm text-zinc-500">None connected</span>
                        ) : (
                            profile.social_accounts.map((account) => (
                                <Badge key={`${account.platform}-${account.username}`} variant="brand">
                                    {account.platform}: {account.username || 'connected'}
                                </Badge>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
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
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
                        Points by source
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {analytics.points_by_source.map((row) => (
                            <div
                                key={row.source_type}
                                className="rounded-xl border border-white/10 bg-surface-800/50 px-4 py-3"
                            >
                                <div className="text-xs uppercase tracking-wider text-zinc-500">
                                    {String(row.source_type).replaceAll('_', ' ')}
                                </div>
                                <div className="mt-1 text-lg font-semibold text-white">
                                    {formatNumber(row.total)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {canEdit && editing && (
                <section className="mb-8 rounded-2xl border border-white/10 bg-surface-800/50 p-6">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
                        Edit profile
                    </h2>
                    <form onSubmit={submitProfile} className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Name" error={form.errors.name}>
                            <FormInput
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                required
                            />
                        </FormField>
                        <FormField label="Email" error={form.errors.email}>
                            <FormInput
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                required
                            />
                        </FormField>
                        <FormField label="Username" error={form.errors.username}>
                            <FormInput
                                value={form.data.username}
                                onChange={(e) => form.setData('username', e.target.value)}
                            />
                        </FormField>
                        <FormField label="Handle" error={form.errors.handle}>
                            <FormInput
                                value={form.data.handle}
                                onChange={(e) => form.setData('handle', e.target.value)}
                            />
                        </FormField>
                        <FormField label="Country" error={form.errors.country}>
                            <FormInput
                                value={form.data.country}
                                onChange={(e) => form.setData('country', e.target.value)}
                            />
                        </FormField>
                        <FormField label="League" error={form.errors.league}>
                            <FormInput
                                value={form.data.league}
                                onChange={(e) => form.setData('league', e.target.value)}
                            />
                        </FormField>
                        <FormField label="Club" error={form.errors.club}>
                            <FormInput
                                value={form.data.club}
                                onChange={(e) => form.setData('club', e.target.value)}
                            />
                        </FormField>
                        <FormField label="Loyalty tier" error={form.errors.loyalty_tier_id}>
                            <FormSelect
                                value={form.data.loyalty_tier_id ?? ''}
                                onChange={(e) => form.setData('loyalty_tier_id', e.target.value)}
                            >
                                <option value="">No tier</option>
                                {loyaltyTiers.map((tier) => (
                                    <option key={tier.id} value={tier.id}>
                                        {tier.name}
                                    </option>
                                ))}
                            </FormSelect>
                        </FormField>
                        <FormField label="Total points" error={form.errors.total_points}>
                            <FormInput
                                type="number"
                                min="0"
                                value={form.data.total_points}
                                onChange={(e) => form.setData('total_points', e.target.value)}
                            />
                        </FormField>
                        <FormField label="New password" hint="Leave blank to keep current password." error={form.errors.password}>
                            <FormInput
                                type="password"
                                value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                                autoComplete="new-password"
                            />
                        </FormField>
                        <div className="flex justify-end gap-2 sm:col-span-2">
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="rounded-lg px-4 py-2 text-sm text-zinc-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                            >
                                Save changes
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {canManageStaff && (
                <section className="mb-8 rounded-2xl border border-white/10 bg-surface-800/50 p-6">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
                        Staff assignment
                    </h2>
                    {staffError && <p className="mb-3 text-sm text-red-400">{staffError}</p>}
                    <div className="mb-4 grid gap-3 sm:grid-cols-3">
                        <div>
                            <div className="text-xs text-zinc-500">Position</div>
                            <div className="text-sm text-white">{staffProfile?.position_label ?? 'Regular fan'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500">Status</div>
                            <div className="text-sm text-white">{staffProfile?.status_label ?? '—'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500">Assigned by</div>
                            <div className="text-sm text-white">{staffProfile?.assigned_by?.name ?? '—'}</div>
                        </div>
                    </div>
                    <form onSubmit={saveStaff} className="grid gap-3 sm:grid-cols-2">
                        <select
                            value={staffForm.staff_position}
                            onChange={(e) => setStaffForm({ ...staffForm, staff_position: e.target.value })}
                            className="rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm"
                            required
                        >
                            <option value="">Select staff position</option>
                            {staffPositions.map((position) => (
                                <option key={position.value} value={position.value}>
                                    {position.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={staffForm.staff_status}
                            onChange={(e) => setStaffForm({ ...staffForm, staff_status: e.target.value })}
                            className="rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <div className="flex gap-2 sm:col-span-2">
                            <button
                                type="submit"
                                disabled={staffLoading}
                                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                            >
                                {profile.is_staff ? 'Update staff' : 'Assign staff'}
                            </button>
                            {profile.is_staff && (
                                <button
                                    type="button"
                                    onClick={removeStaff}
                                    disabled={staffLoading}
                                    className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300"
                                >
                                    Remove staff
                                </button>
                            )}
                        </div>
                    </form>
                </section>
            )}

            <div className="grid gap-8 lg:grid-cols-2">
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
                        Recent transactions
                    </h2>
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-800/50">
                        {(analytics?.recent_transactions ?? []).length === 0 ? (
                            <p className="p-4 text-sm text-zinc-500">No point transactions yet.</p>
                        ) : (
                            <ul className="divide-y divide-white/5">
                                {analytics.recent_transactions.map((tx) => (
                                    <li key={tx.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                        <div>
                                            <div className="text-sm text-white">{tx.reason || tx.source_type}</div>
                                            <div className="text-xs text-zinc-500">
                                                {tx.created_at ? formatDateTime(tx.created_at) : '—'}
                                            </div>
                                        </div>
                                        <div className={`text-sm font-medium ${tx.amount >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                            {tx.amount >= 0 ? '+' : ''}
                                            {formatNumber(tx.amount)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
                        Recent task progress
                    </h2>
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-800/50">
                        {(analytics?.recent_tasks ?? []).length === 0 ? (
                            <p className="p-4 text-sm text-zinc-500">No task activity yet.</p>
                        ) : (
                            <ul className="divide-y divide-white/5">
                                {analytics.recent_tasks.map((task) => (
                                    <li key={task.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                        <div>
                                            <div className="text-sm text-white">{task.task_name || 'Task'}</div>
                                            <div className="text-xs text-zinc-500">
                                                {task.task_code} · {task.updated_at ? formatDateTime(task.updated_at) : '—'}
                                            </div>
                                        </div>
                                        <Badge variant={statusVariant(task.status)}>
                                            {String(task.status).replaceAll('_', ' ')}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
                        Daily claims
                    </h2>
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-800/50">
                        {(analytics?.recent_claims ?? []).length === 0 ? (
                            <p className="p-4 text-sm text-zinc-500">No daily claims yet.</p>
                        ) : (
                            <ul className="divide-y divide-white/5">
                                {analytics.recent_claims.map((claim) => (
                                    <li key={claim.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                        <div>
                                            <div className="text-sm text-white">
                                                Day {claim.streak_day_number ?? '—'} · ×{claim.multiplier ?? 1}
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                {claim.claimed_at ? formatDateTime(claim.claimed_at) : claim.claim_date}
                                            </div>
                                        </div>
                                        <div className="text-sm text-emerald-300">+{formatNumber(claim.points_awarded)}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
                        Referrals made
                    </h2>
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-800/50">
                        {(analytics?.recent_referrals ?? []).length === 0 ? (
                            <p className="p-4 text-sm text-zinc-500">No referrals yet.</p>
                        ) : (
                            <ul className="divide-y divide-white/5">
                                {analytics.recent_referrals.map((referral) => (
                                    <li key={referral.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                        <div>
                                            <div className="text-sm text-white">{referral.referred_name || 'Fan'}</div>
                                            <div className="text-xs text-zinc-500">
                                                {referral.referred_fan_id} ·{' '}
                                                {referral.created_at ? formatDateTime(referral.created_at) : '—'}
                                            </div>
                                        </div>
                                        <Badge variant={statusVariant(referral.status)}>{referral.status}</Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
