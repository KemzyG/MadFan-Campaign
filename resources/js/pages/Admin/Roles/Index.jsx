import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '../../../Components/Admin/Modal';
import { FormField, FormInput } from '../../../Components/Admin/FormField';
import AdminLayout from '../../../Layouts/AdminLayout';
import DataTable from '../../../Components/DataTable';
import FilterBar from '../../../Components/FilterBar';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
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
                <button type="button" onClick={() => openEdit(role)} className="text-xs text-brand-300">
                    Edit
                </button>
                <button type="button" onClick={() => deleteRole(role)} className="text-xs text-red-400">
                    Delete
                </button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Roles">
            <PageHeader
                title="Roles"
                description="Spatie permission roles that define each operator desk."
                actions={
                    <button
                        type="button"
                        onClick={openCreate}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                    >
                        New role
                    </button>
                }
            />
            <FilterBar
                route={`${base}/roles`}
                filters={filters}
                fields={[{ name: 'search', label: 'Search', placeholder: 'Role name…' }]}
            />
            <DataTable columns={columns} rows={rows} />
            <Pagination links={roles?.links} meta={roles} />

            {modalOpen && (
                <Modal title={editingId ? 'Edit role' : 'Create role'} onClose={() => setModalOpen(false)}>
                    <form onSubmit={saveRole} className="space-y-3">
                        <FormField label="Role name">
                            <FormInput
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </FormField>
                        <FormField label="Permissions" hint="Hold Ctrl/Cmd to multi-select.">
                            <select
                                multiple
                                value={form.permissions}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        permissions: Array.from(e.target.selectedOptions).map((o) => o.value),
                                    })
                                }
                                className="h-40 w-full rounded-lg border border-white/10 bg-surface-700 px-3 py-2 text-sm"
                            >
                                {permissions?.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setModalOpen(false)} className="text-sm text-zinc-400">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900 disabled:opacity-60"
                            >
                                {loading ? 'Saving…' : editingId ? 'Save' : 'Create'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </AdminLayout>
    );
}
