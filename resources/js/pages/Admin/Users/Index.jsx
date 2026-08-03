import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import DataTable from '../../../Components/DataTable';
import FilterBar from '../../../Components/FilterBar';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';
import { formatDateTime, formatNumber } from '../../../lib/format';

export default function UsersIndex({
    users,
    filters,
    roles,
    can_create: canCreate = false,
    can_delete: canDelete = false,
}) {
    const page = usePage();
    const base = adminPath(page.props);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function createUser(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await adminApi('/users', { method: 'POST', body: form });
            setModalOpen(false);
            setForm({ name: '', email: '', password: '', role: '' });
            router.reload({ only: ['users'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteUser(id) {
        if (!confirm('Delete this user?')) return;
        await adminApi(`/users/${id}`, { method: 'DELETE' });
        router.reload({ only: ['users'] });
    }

    const columns = [
        { key: 'fan', label: 'Fan' },
        { key: 'email', label: 'Email' },
        { key: 'fan_id', label: 'Fan ID' },
        { key: 'points', label: 'Points' },
        { key: 'staff', label: 'Staff' },
        { key: 'tier', label: 'Tier' },
        { key: 'roles', label: 'Roles' },
        { key: 'joined', label: 'Joined' },
        { key: 'actions', label: 'Actions' },
    ];

    const rows = (users?.data ?? []).map((user) => ({
        ...user,
        fan: (
            <div>
                <Link
                    href={`${base}/users/${user.id}`}
                    className="font-medium text-white underline decoration-white/20 underline-offset-2 hover:text-brand-300 hover:decoration-brand-300"
                >
                    {user.name}
                </Link>
                <div className="mt-0.5 text-xs text-zinc-500">Click for profile & stats</div>
            </div>
        ),
        email: user.email ?? '—',
        points: formatNumber(user.total_points),
        staff: user.is_staff ? user.staff_position?.replaceAll('_', ' ') : '—',
        tier: user.loyalty_tier?.name ?? '—',
        roles: user.roles?.map((r) => r.name).join(', ') || '—',
        joined: formatDateTime(user.created_at),
        actions: (
            <div className="flex flex-wrap items-center gap-2">
                <Link
                    href={`${base}/users/${user.id}`}
                    className="rounded-md border border-brand-500/40 bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-200 hover:bg-brand-500/20"
                >
                    View profile & stats
                </Link>
                {canDelete && (
                    <button
                        type="button"
                        onClick={() => deleteUser(user.id)}
                        className="rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10"
                    >
                        Delete
                    </button>
                )}
            </div>
        ),
    }));

    return (
        <AdminLayout title="Users">
            <PageHeader
                title="Fans & users"
                description="Use View profile & stats on any row to open performance, analytics, and activity."
                actions={
                    canCreate ? (
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900 hover:bg-brand-400"
                        >
                            Add user
                        </button>
                    ) : null
                }
            />

            <FilterBar
                route={`${base}/users`}
                filters={filters}
                fields={[
                    { name: 'search', label: 'Search', placeholder: 'Name, email, fan ID…' },
                    {
                        name: 'role',
                        label: 'Role',
                        type: 'select',
                        options: roles?.map((r) => ({ value: r, label: r })),
                    },
                ]}
            />

            <DataTable
                columns={columns}
                rows={rows}
                emptyMessage="No users match your filters."
            />

            <Pagination links={users?.links} meta={users} />

            {modalOpen && canCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <form
                        onSubmit={createUser}
                        className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-800 p-6"
                    >
                        <h3 className="text-lg font-semibold text-white">Create user</h3>
                        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                        <div className="mt-4 space-y-3">
                            {['name', 'email', 'password'].map((field) => (
                                <input
                                    key={field}
                                    type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                                    value={form[field]}
                                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                                    className="w-full rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm"
                                    required
                                />
                            ))}
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                className="w-full rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm"
                            >
                                <option value="">No role</option>
                                {roles?.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-zinc-400">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900">
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
