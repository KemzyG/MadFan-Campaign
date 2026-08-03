import { router } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '../../../Components/Admin/Modal';
import { FormField, FormInput, FormSelect } from '../../../Components/Admin/FormField';
import AdminLayout from '../../../Layouts/AdminLayout';
import Badge from '../../../Components/Badge';
import DataTable from '../../../Components/DataTable';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
import { adminApi } from '../../../lib/api';
import { formatDate } from '../../../lib/format';

const emptyForm = () => ({
    code: '',
    name: '',
    status: 'draft',
    starts_at: '',
    ends_at: '',
    total_weeks: 4,
});

function seasonToForm(season) {
    return {
        code: season.code ?? '',
        name: season.name ?? '',
        status: season.status ?? 'draft',
        starts_at: season.starts_at ? String(season.starts_at).slice(0, 10) : '',
        ends_at: season.ends_at ? String(season.ends_at).slice(0, 10) : '',
        total_weeks: season.total_weeks ?? 4,
    };
}

export default function SeasonsIndex({ seasons }) {
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

    function openEdit(season) {
        setEditingId(season.id);
        setForm(seasonToForm(season));
        setError('');
        setModalOpen(true);
    }

    async function saveSeason(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (editingId) {
                await adminApi(`/seasons/${editingId}`, { method: 'PUT', body: form });
            } else {
                await adminApi('/seasons', { method: 'POST', body: form });
            }
            setModalOpen(false);
            router.reload({ only: ['seasons'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteSeason(season) {
        if (!confirm(`Delete season “${season.name}”?`)) {
            return;
        }
        try {
            await adminApi(`/seasons/${season.id}`, { method: 'DELETE' });
            router.reload({ only: ['seasons'] });
        } catch (err) {
            alert(err.message);
        }
    }

    const statusVariant = {
        active: 'success',
        draft: 'default',
        completed: 'brand',
        archived: 'warning',
    };

    const columns = [
        { key: 'name', label: 'Season' },
        { key: 'code', label: 'Code' },
        { key: 'status', label: 'Status' },
        { key: 'period', label: 'Period' },
        { key: 'tasks', label: 'Tasks' },
        { key: 'weeks', label: 'Weeks' },
        { key: 'actions', label: '' },
    ];

    const rows = (seasons?.data ?? []).map((season) => ({
        ...season,
        status: <Badge variant={statusVariant[season.status] ?? 'default'}>{season.status}</Badge>,
        period: `${formatDate(season.starts_at)} – ${formatDate(season.ends_at)}`,
        tasks: season.tasks_count ?? 0,
        weeks: season.season_weeks_count ?? 0,
        actions: (
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => openEdit(season)} className="text-xs text-brand-300">
                    Edit
                </button>
                <button type="button" onClick={() => deleteSeason(season)} className="text-xs text-red-400">
                    Delete
                </button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Seasons">
            <PageHeader
                title="Seasons"
                description="Time-boxed loyalty campaigns and point budgets."
                actions={
                    <button
                        type="button"
                        onClick={openCreate}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                    >
                        New season
                    </button>
                }
            />
            <DataTable columns={columns} rows={rows} />
            <Pagination links={seasons?.links} meta={seasons} />

            {modalOpen && (
                <Modal title={editingId ? 'Edit season' : 'Create season'} onClose={() => setModalOpen(false)}>
                    <form onSubmit={saveSeason} className="space-y-3">
                        <FormField label="Code">
                            <FormInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                        </FormField>
                        <FormField label="Name">
                            <FormInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </FormField>
                        <FormField label="Status">
                            <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                {['draft', 'active', 'completed', 'archived'].map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </FormSelect>
                        </FormField>
                        <FormField label="Starts">
                            <FormInput type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required />
                        </FormField>
                        <FormField label="Ends">
                            <FormInput type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} required />
                        </FormField>
                        <FormField label="Total weeks">
                            <FormInput
                                type="number"
                                min="1"
                                value={form.total_weeks}
                                onChange={(e) => setForm({ ...form, total_weeks: Number(e.target.value) })}
                                required
                            />
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
