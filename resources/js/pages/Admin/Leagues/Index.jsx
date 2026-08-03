import { router } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '../../../Components/Admin/Modal';
import { FormField, FormInput } from '../../../Components/Admin/FormField';
import AdminLayout from '../../../Layouts/AdminLayout';
import DataTable from '../../../Components/DataTable';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
import { adminApi } from '../../../lib/api';

const emptyForm = () => ({
    name: '',
    short: '',
    logoFile: null,
    remove_logo: false,
});

function leagueToForm(league) {
    return {
        name: league.name ?? '',
        short: league.short ?? '',
        logoFile: null,
        remove_logo: false,
        logo_url: league.logo_url ?? null,
    };
}

function buildPayload(form) {
    const data = new FormData();
    data.append('name', form.name);
    data.append('short', form.short);
    if (form.logoFile) {
        data.append('logo', form.logoFile);
    }
    if (form.remove_logo) {
        data.append('remove_logo', '1');
    }

    return data;
}

export default function LeaguesIndex({ leagues }) {
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

    function openEdit(league) {
        setEditingId(league.id);
        setForm(leagueToForm(league));
        setError('');
        setModalOpen(true);
    }

    async function saveLeague(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload = buildPayload(form);
            if (editingId) {
                payload.append('_method', 'PUT');
                await adminApi(`/leagues/${editingId}`, { method: 'POST', body: payload });
            } else {
                await adminApi('/leagues', { method: 'POST', body: payload });
            }
            setModalOpen(false);
            router.reload({ only: ['leagues'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteLeague(league) {
        if (!confirm(`Delete league “${league.name}”? Clubs in this league will also be deleted.`)) {
            return;
        }
        try {
            await adminApi(`/leagues/${league.id}`, { method: 'DELETE' });
            router.reload({ only: ['leagues'] });
        } catch (err) {
            alert(err.message);
        }
    }

    const columns = [
        { key: 'logo', label: '' },
        { key: 'name', label: 'League' },
        { key: 'short', label: 'Short' },
        { key: 'clubs', label: 'Clubs' },
        { key: 'actions', label: '' },
    ];

    const rows = (leagues?.data ?? []).map((league) => ({
        ...league,
        logo: league.logo_url ? (
            <img src={league.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs text-zinc-500">
                —
            </span>
        ),
        clubs: league.clubs_count ?? 0,
        actions: (
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => openEdit(league)} className="text-xs text-brand-300">
                    Edit
                </button>
                <button type="button" onClick={() => deleteLeague(league)} className="text-xs text-red-400">
                    Delete
                </button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Leagues">
            <PageHeader
                title="Leagues"
                description="Competitions that group clubs for fan affiliation."
                actions={
                    <button
                        type="button"
                        onClick={openCreate}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                    >
                        New league
                    </button>
                }
            />
            <DataTable columns={columns} rows={rows} />
            <Pagination links={leagues?.links} meta={leagues} />

            {modalOpen && (
                <Modal title={editingId ? 'Edit league' : 'Create league'} onClose={() => setModalOpen(false)}>
                    <form onSubmit={saveLeague} className="space-y-3">
                        <FormField label="Name">
                            <FormInput
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </FormField>
                        <FormField label="Short code">
                            <FormInput
                                value={form.short}
                                onChange={(e) => setForm({ ...form, short: e.target.value })}
                                required
                                maxLength={32}
                            />
                        </FormField>
                        <FormField label="Logo">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        logoFile: e.target.files?.[0] ?? null,
                                        remove_logo: false,
                                    })
                                }
                                className="block w-full text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-brand-500/20 file:px-3 file:py-1.5 file:text-brand-200"
                            />
                            {form.logo_url && !form.logoFile && !form.remove_logo && (
                                <div className="mt-2 flex items-center gap-3">
                                    <img src={form.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                    <button
                                        type="button"
                                        className="text-xs text-red-400"
                                        onClick={() => setForm({ ...form, remove_logo: true })}
                                    >
                                        Remove logo
                                    </button>
                                </div>
                            )}
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
