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
import { formatDateTime } from '../../../lib/format';

const empty = () => ({
    home_club_id: '',
    away_club_id: '',
    kickoff_at: '',
    venue: '',
    status: 'upcoming',
    home_score: '',
    away_score: '',
    price: '0',
    competition: '',
});

export default function FixturesIndex({ fixtures, filters = {}, clubs = [], statuses = [] }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(empty);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setEditing(null);
        setForm(empty());
        setError('');
        setOpen(true);
    }

    function openEdit(item) {
        setEditing(item);
        setForm({
            home_club_id: String(item.home_club_id),
            away_club_id: String(item.away_club_id),
            kickoff_at: item.kickoff_at ? String(item.kickoff_at).slice(0, 16) : '',
            venue: item.venue ?? '',
            status: item.status,
            home_score: item.home_score ?? '',
            away_score: item.away_score ?? '',
            price: item.price ?? '',
            competition: item.competition ?? '',
        });
        setError('');
        setOpen(true);
    }

    async function save(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                ...form,
                home_club_id: Number(form.home_club_id),
                away_club_id: Number(form.away_club_id),
                home_score: form.home_score === '' ? null : Number(form.home_score),
                away_score: form.away_score === '' ? null : Number(form.away_score),
                price: Number(form.price || 0),
            };
            if (editing) await adminApi(`/fixtures/${editing.id}`, { method: 'PUT', body: payload });
            else await adminApi('/fixtures', { method: 'POST', body: payload });
            setOpen(false);
            router.reload({ only: ['fixtures'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function remove(item) {
        if (!confirm('Delete this fixture?')) return;
        await adminApi(`/fixtures/${item.id}`, { method: 'DELETE' });
        router.reload({ only: ['fixtures'] });
    }

    const rows = (fixtures?.data ?? []).map((item) => ({
        ...item,
        match: `${item.home_club?.name ?? '?'} vs ${item.away_club?.name ?? '?'}`,
        kickoff: formatDateTime(item.kickoff_at),
        score: item.status === 'upcoming' ? '—' : `${item.home_score ?? 0}-${item.away_score ?? 0}`,
        statusBadge: <Badge variant="secondary">{item.status}</Badge>,
        tickets: item.tickets_count ?? 0,
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(item)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => remove(item)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Fixtures">
            <AdminPageHeader
                title="Fixtures"
                description="Match fixtures for tickets, predictions, and live events."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New fixture
                    </Button>
                }
            />
            <div className="mb-4">
                <NativeSelect className="w-full"
                    value={filters.status ?? ''}
                    onChange={(e) =>
                        router.get(window.location.pathname, { status: e.target.value || undefined }, { preserveState: true, replace: true })
                    }
                >
                    <NativeSelectOption value="">All statuses</NativeSelectOption>
                    {statuses.map((status) => (
                        <NativeSelectOption key={status} value={status}>
                            {status}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </div>
            <AdminTable
                columns={[
                    { key: 'match', label: 'Match' },
                    { key: 'competition', label: 'Competition' },
                    { key: 'kickoff', label: 'Kickoff' },
                    { key: 'score', label: 'Score' },
                    { key: 'statusBadge', label: 'Status' },
                    { key: 'tickets', label: 'Tickets' },
                    { key: 'actions', label: '' },
                ]}
                rows={rows}
            />
            <AdminPagination links={fixtures?.links} meta={fixtures} />
            <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{editing ? 'Edit fixture' : 'Create fixture'}</DialogTitle></DialogHeader>
                <form onSubmit={save} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field ><FieldLabel>Home club</FieldLabel>
                            <NativeSelect className="w-full" value={form.home_club_id} onChange={(e) => setForm({ ...form, home_club_id: e.target.value })} required>
                                <NativeSelectOption value="">Select</NativeSelectOption>
                                {clubs.map((club) => (
                                    <NativeSelectOption key={club.id} value={club.id}>
                                        {club.name}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                        <Field ><FieldLabel>Away club</FieldLabel>
                            <NativeSelect className="w-full" value={form.away_club_id} onChange={(e) => setForm({ ...form, away_club_id: e.target.value })} required>
                                <NativeSelectOption value="">Select</NativeSelectOption>
                                {clubs.map((club) => (
                                    <NativeSelectOption key={club.id} value={club.id}>
                                        {club.name}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                    </div>
                    <Field ><FieldLabel>Kickoff</FieldLabel>
                        <Input type="datetime-local" value={form.kickoff_at} onChange={(e) => setForm({ ...form, kickoff_at: e.target.value })} required />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field ><FieldLabel>Status</FieldLabel>
                            <NativeSelect className="w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                {statuses.map((status) => (
                                    <NativeSelectOption key={status} value={status}>
                                        {status}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                        <Field ><FieldLabel>Competition</FieldLabel>
                            <Input value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} />
                        </Field>
                    </div>
                    <Field ><FieldLabel>Venue</FieldLabel>
                        <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Field ><FieldLabel>Home score</FieldLabel>
                            <Input type="number" value={form.home_score} onChange={(e) => setForm({ ...form, home_score: e.target.value })} />
                        </Field>
                        <Field ><FieldLabel>Away score</FieldLabel>
                            <Input type="number" value={form.away_score} onChange={(e) => setForm({ ...form, away_score: e.target.value })} />
                        </Field>
                        <Field ><FieldLabel>Price</FieldLabel>
                            <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                        </Field>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                </form>
            </DialogContent></Dialog>
        </AdminLayout>
    );
}
