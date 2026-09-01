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
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';

const emptyForm = (adminRoles) => ({
    name: '',
    email: '',
    password: '',
    role: adminRoles?.[0]?.name ?? 'admin',
});

export default function AdminsIndex({ admins, adminRoles, filters, can_manage: canManage = false }) {
    const page = usePage();
    const base = adminPath(page.props);
    const meId = page.props.auth?.user?.id;
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(() => emptyForm(adminRoles));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isEditing = editingId != null;

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm(adminRoles));
        setError('');
        setModalOpen(true);
    }

    function openEdit(admin) {
        setEditingId(admin.id);
        setForm({
            name: admin.name ?? '',
            email: admin.email ?? '',
            password: '',
            role: admin.roles?.[0]?.name ?? adminRoles?.[0]?.name ?? 'admin',
        });
        setError('');
        setModalOpen(true);
    }

    async function saveAdmin(e) {
        e.preventDefault();
        if (!canManage) {
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (isEditing) {
                const body = {
                    name: form.name,
                    email: form.email,
                    role: form.role,
                };
                if (form.password) {
                    body.password = form.password;
                }
                await adminApi(`/admins/${editingId}`, { method: 'PUT', body });
            } else {
                await adminApi('/admins', { method: 'POST', body: form });
            }
            setModalOpen(false);
            router.reload({ only: ['admins'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteAdmin(admin) {
        if (!canManage) {
            return;
        }
        if (admin.id === meId) {
            alert('You cannot delete your own account.');
            return;
        }
        if (!confirm(`Delete admin ${admin.email}?`)) {
            return;
        }
        try {
            await adminApi(`/admins/${admin.id}`, { method: 'DELETE' });
            router.reload({ only: ['admins'] });
        } catch (err) {
            alert(err.message);
        }
    }

    const columns = [
        { key: 'name', label: 'Admin' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'actions', label: '' },
    ];

    const rows = (admins?.data ?? []).map((admin) => ({
        ...admin,
        role: (
            <Badge>{admin.roles?.map((r) => r.name).join(', ') || '—'}</Badge>
        ),
        actions: canManage ? (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(admin)}>
                    Edit
                </Button>
                <Button
                    variant="link"
                    size="sm"
                    type="button"
                    className="text-destructive"
                    onClick={() => deleteAdmin(admin)}
                    disabled={admin.id === meId}
                >
                    Delete
                </Button>
            </div>
        ) : (
            <span className="text-xs text-muted-foreground">View only</span>
        ),
    }));

    return (
        <AdminLayout title="Admins">
            <AdminPageHeader
                title="Admin users"
                description="Operator accounts for each role desk (support, management, admin, super-admin)."
                actions={
                    canManage ? (
                        <Button type="button" onClick={openCreate}>
                            Add admin
                        </Button>
                    ) : null
                }
            />
            <AdminFilterBar
                route={`${base}/admins`}
                filters={filters}
                fields={[{ name: 'search', label: 'Search', placeholder: 'Name or email…' }]}
            />
            <AdminTable columns={columns} rows={rows} />
            <AdminPagination links={admins?.links} meta={admins} />

            <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{isEditing ? 'Edit admin' : 'Create admin'}</DialogTitle></DialogHeader>
                <form onSubmit={saveAdmin} className="space-y-3">
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    <Field ><FieldLabel>Name</FieldLabel>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </Field>
                    <Field ><FieldLabel>Email</FieldLabel>
                        <Input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </Field>
                    <Field
                        
                        hint={isEditing ? 'Leave blank to keep current password.' : undefined}
                    ><FieldLabel>Password</FieldLabel>
                        <Input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required={!isEditing}
                        />
                    </Field>
                    <Field ><FieldLabel>Role / desk</FieldLabel>
                        <NativeSelect className="w-full"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            {adminRoles?.map((r) => (
                                <NativeSelectOption key={r.id} value={r.name}>
                                    {r.name}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </Field>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving…' : isEditing ? 'Save' : 'Create'}
                        </Button>
                    </div>
                </form>
            </DialogContent></Dialog>
        </AdminLayout>
    );
}
