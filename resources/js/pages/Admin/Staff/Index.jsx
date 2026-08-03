import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import Badge from '../../../Components/Badge';
import DataTable from '../../../Components/DataTable';
import FilterBar from '../../../Components/FilterBar';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';
import { formatDateTime, formatNumber } from '../../../lib/format';

const statusVariant = {
    active: 'success',
    inactive: 'default',
};

export default function StaffIndex({ staff, filters, staffPositions = [], staffStatuses = [] }) {
    const page = usePage();
    const base = adminPath(page.props);
    const [modalOpen, setModalOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [form, setForm] = useState({ user_id: '', staff_position: '', staff_status: 'active' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function searchUsers(query) {
        setUserSearch(query);
        if (query.length < 2) {
            setUserResults([]);
            return;
        }

        try {
            const data = await adminApi(`/users?search=${encodeURIComponent(query)}&per_page=8`);
            setUserResults((data.data ?? []).filter((user) => !user.is_staff));
        } catch {
            setUserResults([]);
        }
    }

    async function createStaffMember(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await adminApi('/staff', { method: 'POST', body: form });
            setModalOpen(false);
            setForm({ user_id: '', staff_position: '', staff_status: 'active' });
            setUserSearch('');
            setUserResults([]);
            router.reload({ only: ['staff'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const columns = [
        { key: 'name', label: 'Staff member' },
        { key: 'position', label: 'Position' },
        { key: 'status', label: 'Status' },
        { key: 'score', label: 'Score' },
        { key: 'rank', label: 'Rank' },
        { key: 'points', label: 'Points' },
        { key: 'referrals', label: 'Referrals' },
        { key: 'tasks', label: 'Tasks done' },
        { key: 'assigned', label: 'Assigned' },
        { key: 'actions', label: '' },
    ];

    const rows = (staff?.data ?? []).map((member) => ({
        ...member,
        position: member.staff_position_label ?? member.staff_position ?? '—',
        status: (
            <Badge variant={statusVariant[member.staff_status] ?? 'default'}>
                {member.staff_status_label ?? member.staff_status ?? '—'}
            </Badge>
        ),
        score: formatNumber(member.performance_score ?? 0),
        rank: `#${member.staff_rank ?? '—'}`,
        points: formatNumber(member.total_points ?? 0),
        referrals: member.total_referrals ?? 0,
        tasks: member.completed_tasks ?? 0,
        assigned: member.staff_position_assigned_at ? formatDateTime(member.staff_position_assigned_at) : '—',
        actions: (
            <Link href={adminPath(page.props, `staff/${member.id}`)} className="text-xs text-brand-300 hover:text-brand-200">
                View details
            </Link>
        ),
    }));

    return (
        <AdminLayout title="Staff">
            <PageHeader
                title="Staff"
                description="Manage staff positions, assignments, and performance."
                actions={
                    <button
                        onClick={() => setModalOpen(true)}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900 hover:bg-brand-400"
                    >
                        Add staff member
                    </button>
                }
            />

            <FilterBar
                route={base}
                filters={filters}
                fields={[
                    { name: 'search', label: 'Search', placeholder: 'Name, email, fan ID…' },
                    {
                        name: 'staff_position',
                        label: 'Position',
                        type: 'select',
                        options: staffPositions.map((position) => ({ value: position.value, label: position.label })),
                    },
                    {
                        name: 'staff_status',
                        label: 'Status',
                        type: 'select',
                        options: staffStatuses.map((status) => ({ value: status.value, label: status.label })),
                    },
                ]}
            />

            <DataTable columns={columns} rows={rows} emptyMessage="No staff members match your filters." />
            <Pagination links={staff?.links} meta={staff} />

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <form
                        onSubmit={createStaffMember}
                        className="w-full max-w-lg rounded-2xl border border-white/10 bg-surface-800 p-6"
                    >
                        <h3 className="text-lg font-semibold text-white">Add staff member</h3>
                        <p className="mt-1 text-sm text-zinc-400">Promote an existing fan to a staff position.</p>
                        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="mb-1 block text-xs text-zinc-500">Find user</label>
                                <input
                                    type="search"
                                    value={userSearch}
                                    onChange={(e) => searchUsers(e.target.value)}
                                    placeholder="Search by name, email, or fan ID"
                                    className="w-full rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm"
                                />
                                {userResults.length > 0 && (
                                    <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-surface-900">
                                        {userResults.map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => {
                                                    setForm({ ...form, user_id: user.id });
                                                    setUserSearch(`${user.name} (${user.fan_id})`);
                                                    setUserResults([]);
                                                }}
                                                className="block w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5"
                                            >
                                                {user.name} · {user.email} · {user.fan_id}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <select
                                value={form.staff_position}
                                onChange={(e) => setForm({ ...form, staff_position: e.target.value })}
                                className="w-full rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm"
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
                            <button type="button" onClick={() => setModalOpen(false)} className="text-sm text-zinc-400">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !form.user_id}
                                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900 disabled:opacity-50"
                            >
                                Add staff member
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
