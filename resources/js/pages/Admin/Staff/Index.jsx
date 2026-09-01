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
import AdminLayout from '../../../Layouts/AdminLayout';
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
            <Badge variant={adminBadgeVariant(statusVariant[member.staff_status] ?? 'default')} className={adminBadgeClass(statusVariant[member.staff_status] ?? 'default')}>
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
            <Button variant="link" size="sm" asChild>
                <Link href={adminPath(page.props, `staff/${member.id}`)}>View details</Link>
            </Button>
        ),
    }));

    return (
        <AdminLayout title="Staff">
            <AdminPageHeader
                title="Staff"
                description="Manage staff positions, assignments, and performance."
                actions={
                    <Button type="button" onClick={() => setModalOpen(true)}>
                        Add staff member
                    </Button>
                }
            />

            <AdminFilterBar
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

            <AdminTable columns={columns} rows={rows} emptyMessage="No staff members match your filters." />
            <AdminPagination links={staff?.links} meta={staff} />

            <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Add staff member</DialogTitle></DialogHeader>
                <form onSubmit={createStaffMember} className="space-y-3">
                    <p className="text-sm text-muted-foreground">Promote an existing fan to a staff position.</p>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Field ><FieldLabel>Find user</FieldLabel>
                        <Input
                            type="search"
                            value={userSearch}
                            onChange={(e) => searchUsers(e.target.value)}
                            placeholder="Search by name, email, or fan ID"
                        />
                        {userResults.length > 0 && (
                            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/30">
                                {userResults.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => {
                                            setForm({ ...form, user_id: user.id });
                                            setUserSearch(`${user.name} (${user.fan_id})`);
                                            setUserResults([]);
                                        }}
                                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                    >
                                        {user.name} · {user.email} · {user.fan_id}
                                    </button>
                                ))}
                            </div>
                        )}
                    </Field>
                    <Field ><FieldLabel>Staff position</FieldLabel>
                        <NativeSelect className="w-full"
                            value={form.staff_position}
                            onChange={(e) => setForm({ ...form, staff_position: e.target.value })}
                            required
                        >
                            <NativeSelectOption value="">Select staff position</NativeSelectOption>
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
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !form.user_id}>
                            Add staff member
                        </Button>
                    </div>
                </form>
            </DialogContent></Dialog>
        </AdminLayout>
    );
}
