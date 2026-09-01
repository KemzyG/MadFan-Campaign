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
    fandom_id: '',
    name: '',
    short: '',
    logoFile: null,
    remove_logo: false,
});

function leagueToForm(league) {
    return {
        fandom_id: league.fandom_id ? String(league.fandom_id) : '',
        name: league.name ?? '',
        short: league.short ?? '',
        logoFile: null,
        remove_logo: false,
        logo_url: league.logo_url ?? null,
    };
}

function buildPayload(form) {
    const data = new FormData();
    if (form.fandom_id) {
        data.append('fandom_id', form.fandom_id);
    }
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

export default function LeaguesIndex({ leagues, fandoms = [], filters = {} }) {
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
        { key: 'fandom', label: 'Fandom' },
        { key: 'short', label: 'Short' },
        { key: 'clubs', label: 'Clubs' },
        { key: 'actions', label: '' },
    ];

    const rows = (leagues?.data ?? []).map((league) => ({
        ...league,
        logo: league.logo_url ? (
            <img src={league.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">—</span>
        ),
        fandom: league.fandom?.name ?? '—',
        clubs: league.clubs_count ?? 0,
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(league)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => deleteLeague(league)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Leagues">
            <AdminPageHeader
                title="Leagues"
                description="Competitions that group clubs under a fandom."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New league
                    </Button>
                }
            />
            <div className="mb-4">
                <NativeSelect className="w-full"
                    value={filters.fandom_id ?? ''}
                    onChange={(e) =>
                        router.get(
                            window.location.pathname,
                            { fandom_id: e.target.value || undefined },
                            { preserveState: true, replace: true },
                        )
                    }
                >
                    <NativeSelectOption value="">All fandoms</NativeSelectOption>
                    {fandoms.map((fandom) => (
                        <NativeSelectOption key={fandom.id} value={fandom.id}>
                            {fandom.name}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </div>
            <AdminTable columns={columns} rows={rows} />
            <AdminPagination links={leagues?.links} meta={leagues} />

            <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editingId ? 'Edit league' : 'Create league'}</DialogTitle></DialogHeader>
                <form onSubmit={saveLeague} className="space-y-3">
                    <Field ><FieldLabel>Fandom</FieldLabel>
                        <NativeSelect className="w-full" value={form.fandom_id} onChange={(e) => setForm({ ...form, fandom_id: e.target.value })}>
                            <NativeSelectOption value="">None</NativeSelectOption>
                            {fandoms.map((fandom) => (
                                <NativeSelectOption key={fandom.id} value={fandom.id}>
                                    {fandom.name}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </Field>
                    <Field ><FieldLabel>Name</FieldLabel>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Short code</FieldLabel>
                        <Input value={form.short} onChange={(e) => setForm({ ...form, short: e.target.value })} required maxLength={32} />
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
                            className="block w-full text-sm"
                        />
                        {form.logo_url && !form.logoFile && !form.remove_logo && (
                            <div className="mt-2 flex items-center gap-3">
                                <img src={form.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                <Button type="button" variant="link" size="sm" className="text-destructive" onClick={() => setForm({ ...form, remove_logo: true })}>
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
