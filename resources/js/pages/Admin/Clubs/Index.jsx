import { adminBadgeClass, adminBadgeVariant } from '@/lib/admin-badge';
import { AdminFilterBar } from '@/lib/admin-filter-bar';
import { AdminPageHeader } from '@/lib/admin-page-header';
import { AdminPagination } from '@/lib/admin-pagination';
import { AdminTable } from '@/lib/admin-table';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Field, FieldLabel } from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/Components/ui/native-select';
import { Textarea } from '@/Components/ui/textarea';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import AdminLayout from '../../../Layouts/AdminLayout';
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
        { key: 'members', label: 'Members' },
        { key: 'actions', label: '' },
    ];

    const rows = (clubs?.data ?? []).map((club) => ({
        ...club,
        logo: club.logo_url ? (
            <img src={club.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                —
            </span>
        ),
        league: club.league?.name ?? '—',
        members: club.memberships_count ?? 0,
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(club)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => deleteClub(club)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Clubs">
            <AdminPageHeader
                title="Clubs"
                description="Football clubs belonging to a league."
                actions={
                    <Button type="button" onClick={openCreate} disabled={leagues.length === 0}>
                        New club
                    </Button>
                }
            />

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Filter by league</label>
                <NativeSelect className="w-full" value={filters.league_id ?? ''} onChange={(e) => filterByLeague(e.target.value)}>
                    <NativeSelectOption value="">All leagues</NativeSelectOption>
                    {leagues.map((league) => (
                        <NativeSelectOption key={league.id} value={league.id}>
                            {league.name}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </div>

            {leagues.length === 0 && (
                <p className="mb-4 text-sm text-muted-foreground">Create a league before adding clubs.</p>
            )}

            <AdminTable columns={columns} rows={rows} />
            <AdminPagination links={clubs?.links} meta={clubs} />

            <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editingId ? 'Edit club' : 'Create club'}</DialogTitle></DialogHeader>
                <form onSubmit={saveClub} className="space-y-3">
                    <Field ><FieldLabel>League</FieldLabel>
                        <NativeSelect className="w-full"
                            value={form.league_id}
                            onChange={(e) => setForm({ ...form, league_id: e.target.value })}
                            required
                        >
                            <NativeSelectOption value="" disabled>
                                Select league
                            </NativeSelectOption>
                            {leagues.map((league) => (
                                <NativeSelectOption key={league.id} value={league.id}>
                                    {league.name} ({league.short})
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </Field>
                    <Field ><FieldLabel>Name</FieldLabel>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </Field>
                    <Field ><FieldLabel>Short code</FieldLabel>
                        <Input
                            value={form.short}
                            onChange={(e) => setForm({ ...form, short: e.target.value })}
                            required
                            maxLength={32}
                        />
                    </Field>
                    <Field ><FieldLabel>Logo</FieldLabel>
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
                            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5"
                        />
                        {form.logo_url && !form.logoFile && !form.remove_logo && (
                            <div className="mt-2 flex items-center gap-3">
                                <img src={form.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => setForm({ ...form, remove_logo: true })}
                                >
                                    Remove logo
                                </Button>
                            </div>
                        )}
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
