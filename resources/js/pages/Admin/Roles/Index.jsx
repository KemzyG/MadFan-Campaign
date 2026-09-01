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

const emptyForm = () => ({ name: '', permissions: [] });

export default function RolesIndex({ roles, permissions, filters }) {
    const page = usePage();
    const base = adminPath(page.props);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm());
        setError('');
        setModalOpen(true);
    }

    function openEdit(role) {
        setEditingId(role.id);
        setForm({
            name: role.name ?? '',
            permissions: (role.permissions ?? []).map((p) => String(p.id)),
        });
        setError('');
        setModalOpen(true);
    }

    async function saveRole(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const body = {
                name: form.name,
                permissions: form.permissions.map(Number),
            };
            if (editingId) {
                await adminApi(`/roles/${editingId}`, { method: 'PUT', body });
            } else {
                await adminApi('/roles', { method: 'POST', body });
            }
            setModalOpen(false);
            router.reload({ only: ['roles'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteRole(role) {
        if (!confirm(`Delete role “${role.name}”?`)) {
            return;
        }
        try {
            await adminApi(`/roles/${role.id}`, { method: 'DELETE' });
            router.reload({ only: ['roles'] });
        } catch (err) {
            alert(err.message);
        }
    }

    const columns = [
        { key: 'name', label: 'Role' },
        { key: 'permissions', label: 'Permissions' },
        { key: 'guard', label: 'Guard' },
        { key: 'actions', label: '' },
    ];

    const rows = (roles?.data ?? []).map((role) => ({
        ...role,
        permissions: role.permissions?.map((p) => p.name).join(', ') || '—',
        guard: role.guard_name,
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(role)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => deleteRole(role)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Roles">
            <AdminPageHeader
                title="Roles"
                description="Spatie permission roles that define each operator desk."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New role
                    </Button>
                }
            />
            <AdminFilterBar
                route={`${base}/roles`}
                filters={filters}
                fields={[{ name: 'search', label: 'Search', placeholder: 'Role name…' }]}
            />
            <AdminTable columns={columns} rows={rows} />
            <AdminPagination links={roles?.links} meta={roles} />

            <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editingId ? 'Edit role' : 'Create role'}</DialogTitle></DialogHeader>
                <form onSubmit={saveRole} className="space-y-3">
                    <Field ><FieldLabel>Role name</FieldLabel>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </Field>
                    <Field  hint="Hold Ctrl/Cmd to multi-select."><FieldLabel>Permissions</FieldLabel>
                        <select
                            multiple
                            value={form.permissions}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    permissions: Array.from(e.target.selectedOptions).map((o) => o.value),
                                })
                            }
                            className="h-40 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs dark:bg-input/30"
                        >
                            {permissions?.map((p) => (
                                <NativeSelectOption key={p.id} value={p.id}>
                                    {p.name}
                                </NativeSelectOption>
                            ))}
                        </select>
                    </Field>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving…' : editingId ? 'Save' : 'Create'}
                        </Button>
                    </div>
                </form>
            </DialogContent></Dialog>
        </AdminLayout>
    );
}
