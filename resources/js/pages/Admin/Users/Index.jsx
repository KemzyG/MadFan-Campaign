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
                <Link href={`${base}/users/${user.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                    {user.name}
                </Link>
                <div className="mt-0.5 text-xs text-muted-foreground">Click for profile & stats</div>
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
                <Button variant="outline" size="sm" asChild>
                    <Link href={`${base}/users/${user.id}`}>View profile & stats</Link>
                </Button>
                {canDelete && (
                    <Button variant="outline" size="sm" className="text-destructive" type="button" onClick={() => deleteUser(user.id)}>
                        Delete
                    </Button>
                )}
            </div>
        ),
    }));

    return (
        <AdminLayout title="Users">
            <AdminPageHeader
                title="Fans & users"
                description="Use View profile & stats on any row to open performance, analytics, and activity."
                actions={
                    canCreate ? (
                        <Button type="button" onClick={() => setModalOpen(true)}>
                            Add user
                        </Button>
                    ) : null
                }
            />

            <AdminFilterBar
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

            <AdminTable columns={columns} rows={rows} emptyMessage="No users match your filters." />

            <AdminPagination links={users?.links} meta={users} />

            {canCreate && (
                <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Create user</DialogTitle></DialogHeader>
                    <form onSubmit={createUser} className="space-y-3">
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        {['name', 'email', 'password'].map((field) => (
                            <Field key={field} ><FieldLabel>field.charAt(0).toUpperCase() + field.slice(1)</FieldLabel>
                                <Input
                                    type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                                    value={form[field]}
                                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                                    required
                                />
                            </Field>
                        ))}
                        <Field ><FieldLabel>Role</FieldLabel>
                            <NativeSelect className="w-full" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                <NativeSelectOption value="">No role</NativeSelectOption>
                                {roles?.map((r) => (
                                    <NativeSelectOption key={r} value={r}>
                                        {r}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                Create
                            </Button>
                        </div>
                    </form>
                </DialogContent></Dialog>
            )}
        </AdminLayout>
    );
}
