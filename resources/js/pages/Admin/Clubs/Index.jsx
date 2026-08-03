import { router } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '../../../Components/Admin/Modal';
import { FormField, FormInput, FormSelect } from '../../../Components/Admin/FormField';
import AdminLayout from '../../../Layouts/AdminLayout';
import DataTable from '../../../Components/DataTable';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
import { adminApi } from '../../../lib/api';

const emptyForm = () => ({
    league_id: '',
    name: '',
    short: '',
    logoFile: null,
    remove_logo: false,
});

function clubToForm(club) {
    return {
        league_id: club.league_id ? String(club.league_id) : '',
        name: club.name ?? '',
        short: club.short ?? '',
        logoFile: null,
        remove_logo: false,
        logo_url: club.logo_url ?? null,
    };
}

function buildPayload(form) {
    const data = new FormData();
    data.append('league_id', form.league_id);
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

export default function ClubsIndex({ clubs, leagues = [], filters = {} }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setEditingId(null);
        setForm({
            ...emptyForm(),
            league_id: filters.league_id ? String(filters.league_id) : leagues[0] ? String(leagues[0].id) : '',
        });
        setError('');
        setModalOpen(true);
    }

    function openEdit(club) {
        setEditingId(club.id);
        setForm(clubToForm(club));
        setError('');
        setModalOpen(true);
    }

    function filterByLeague(leagueId) {
        router.get(
            window.location.pathname,
            leagueId ? { league_id: leagueId } : {},
            { preserveState: true, replace: true },
        );
    }

    async function saveClub(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload = buildPayload(form);
            if (editingId) {
                payload.append('_method', 'PUT');
                await adminApi(`/clubs/${editingId}`, { method: 'POST', body: payload });
            } else {
                await adminApi('/clubs', { method: 'POST', body: payload });
            }
            setModalOpen(false);
            router.reload({ only: ['clubs'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteClub(club) {
        if (!confirm(`Delete club “${club.name}”?`)) {
            return;
        }
        try {
            await adminApi(`/clubs/${club.id}`, { method: 'DELETE' });
            router.reload({ only: ['clubs'] });
        } catch (err) {
            alert(err.message);
        }
    }

    const columns = [
        { key: 'logo', label: '' },
        { key: 'name', label: 'Club' },
        { key: 'short', label: 'Short' },
        { key: 'league', label: 'League' },
        { key: 'actions', label: '' },
    ];

    const rows = (clubs?.data ?? []).map((club) => ({
        ...club,
        logo: club.logo_url ? (
            <img src={club.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs text-zinc-500">
                —
            </span>
        ),
        league: club.league?.name ?? '—',
        actions: (
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => openEdit(club)} className="text-xs text-brand-300">
                    Edit
                </button>
                <button type="button" onClick={() => deleteClub(club)} className="text-xs text-red-400">
                    Delete
                </button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Clubs">
            <PageHeader
                title="Clubs"
                description="Football clubs belonging to a league."
                actions={
                    <button
                        type="button"
                        onClick={openCreate}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                        disabled={leagues.length === 0}
                    >
                        New club
                    </button>
                }
            />

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <label className="text-xs uppercase tracking-wide text-zinc-500">Filter by league</label>
                <select
                    value={filters.league_id ?? ''}
                    onChange={(e) => filterByLeague(e.target.value)}
                    className="rounded-lg border border-white/10 bg-surface-800 px-3 py-2 text-sm text-white"
                >
                    <option value="">All leagues</option>
                    {leagues.map((league) => (
                        <option key={league.id} value={league.id}>
                            {league.name}
                        </option>
                    ))}
                </select>
            </div>

            {leagues.length === 0 && (
                <p className="mb-4 text-sm text-amber-200">Create a league before adding clubs.</p>
            )}

            <DataTable columns={columns} rows={rows} />
            <Pagination links={clubs?.links} meta={clubs} />

            {modalOpen && (
                <Modal title={editingId ? 'Edit club' : 'Create club'} onClose={() => setModalOpen(false)}>
                    <form onSubmit={saveClub} className="space-y-3">
                        <FormField label="League">
                            <FormSelect
                                value={form.league_id}
                                onChange={(e) => setForm({ ...form, league_id: e.target.value })}
                                required
                            >
                                <option value="" disabled>
                                    Select league
                                </option>
                                {leagues.map((league) => (
                                    <option key={league.id} value={league.id}>
                                        {league.name} ({league.short})
                                    </option>
                                ))}
                            </FormSelect>
                        </FormField>
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
