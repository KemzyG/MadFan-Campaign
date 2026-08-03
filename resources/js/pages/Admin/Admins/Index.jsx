import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '../../../Components/Admin/Modal';
import { FormField, FormInput, FormSelect } from '../../../Components/Admin/FormField';
import AdminLayout from '../../../Layouts/AdminLayout';
import Badge from '../../../Components/Badge';
import DataTable from '../../../Components/DataTable';
import FilterBar from '../../../Components/FilterBar';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
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
            <Badge variant="brand">{admin.roles?.map((r) => r.name).join(', ') || '—'}</Badge>
        ),
        actions: canManage ? (
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => openEdit(admin)} className="text-xs text-brand-300">
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => deleteAdmin(admin)}
                    className="text-xs text-red-400"
                    disabled={admin.id === meId}
                >
                    Delete
                </button>
            </div>
        ) : (
            <span className="text-xs text-zinc-600">View only</span>
        ),
    }));

    return (
        <AdminLayout title="Admins">
            <PageHeader
                title="Admin users"
                description="Operator accounts for each role desk (support, management, admin, super-admin)."
                actions={
                    canManage ? (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                        >
                            Add admin
                        </button>
                    ) : null
                }
            />
            <FilterBar
                route={`${base}/admins`}
                filters={filters}
                fields={[{ name: 'search', label: 'Search', placeholder: 'Name or email…' }]}
            />
            <DataTable columns={columns} rows={rows} />
            <Pagination links={admins?.links} meta={admins} />

            {modalOpen && (
                <Modal title={isEditing ? 'Edit admin' : 'Create admin'} onClose={() => setModalOpen(false)}>
                    <form onSubmit={saveAdmin} className="space-y-3">
                        {error ? <p className="text-sm text-red-400">{error}</p> : null}
                        <FormField label="Name">
                            <FormInput
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </FormField>
                        <FormField label="Email">
                            <FormInput
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </FormField>
                        <FormField
                            label="Password"
                            hint={isEditing ? 'Leave blank to keep current password.' : undefined}
                        >
                            <FormInput
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required={!isEditing}
                            />
                        </FormField>
                        <FormField label="Role / desk">
                            <FormSelect
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                            >
                                {adminRoles?.map((r) => (
                                    <option key={r.id} value={r.name}>
                                        {r.name}
                                    </option>
                                ))}
                            </FormSelect>
                        </FormField>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setModalOpen(false)} className="text-sm text-zinc-400">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900 disabled:opacity-60"
                            >
                                {loading ? 'Saving…' : isEditing ? 'Save' : 'Create'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </AdminLayout>
    );
}
