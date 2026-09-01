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
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';

export default function PredictionsIndex({ predictions, fandoms = [], seasons = [], fixtures = [], choices = [] }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        match_fixture_id: '',
        fandom_id: '',
        season_id: '',
        points_reward: 10,
        closes_at: '',
        correct_choice: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setEditing(null);
        setForm({ match_fixture_id: '', fandom_id: '', season_id: '', points_reward: 10, closes_at: '', correct_choice: '' });
        setError('');
        setOpen(true);
    }

    function openEdit(item) {
        setEditing(item);
        setForm({
            match_fixture_id: String(item.match_fixture_id),
            fandom_id: item.fandom_id ? String(item.fandom_id) : '',
            season_id: item.season_id ? String(item.season_id) : '',
            points_reward: item.points_reward ?? 10,
            closes_at: item.closes_at ? String(item.closes_at).slice(0, 16) : '',
            correct_choice: item.correct_choice ?? '',
        });
        setError('');
        setOpen(true);
    }

    async function save(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (editing) {
                await adminApi(`/predictions/${editing.id}`, {
                    method: 'PUT',
                    body: {
                        fandom_id: form.fandom_id || null,
                        season_id: form.season_id || null,
                        points_reward: Number(form.points_reward),
                        closes_at: form.closes_at,
                        correct_choice: form.correct_choice || null,
                    },
                });
            } else {
                await adminApi('/predictions', {
                    method: 'POST',
                    body: {
                        match_fixture_id: Number(form.match_fixture_id),
                        fandom_id: form.fandom_id || null,
                        season_id: form.season_id || null,
                        points_reward: Number(form.points_reward),
                        closes_at: form.closes_at,
                    },
                });
            }
            setOpen(false);
            router.reload({ only: ['predictions'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function remove(item) {
        if (!confirm('Delete this prediction?')) return;
        await adminApi(`/predictions/${item.id}`, { method: 'DELETE' });
        router.reload({ only: ['predictions'] });
    }

    const rows = (predictions?.data ?? []).map((item) => ({
        ...item,
        match: item.match_fixture
            ? `${item.match_fixture.home_club?.name ?? '?'} vs ${item.match_fixture.away_club?.name ?? '?'}`
            : '—',
        fandom: item.fandom?.name ?? '—',
        entries: item.user_predictions_count ?? 0,
        closes: formatDateTime(item.closes_at),
        status: item.resolved_at ? <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Resolved</Badge> : <Badge>Open</Badge>,
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
        <AdminLayout title="Predictions">
            <AdminPageHeader
                title="Predictions"
                description="Match prediction games tied to fixtures."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New prediction
                    </Button>
                }
            />
            <AdminTable
                columns={[
                    { key: 'match', label: 'Fixture' },
                    { key: 'fandom', label: 'Fandom' },
                    { key: 'points_reward', label: 'Points' },
                    { key: 'entries', label: 'Entries' },
                    { key: 'closes', label: 'Closes' },
                    { key: 'status', label: 'Status' },
                    { key: 'actions', label: '' },
                ]}
                rows={rows}
            />
            <AdminPagination links={predictions?.links} meta={predictions} />
            <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editing ? 'Edit prediction' : 'Create prediction'}</DialogTitle></DialogHeader>
                <form onSubmit={save} className="space-y-3">
                    {!editing && (
                        <Field ><FieldLabel>Fixture</FieldLabel>
                            <NativeSelect className="w-full" value={form.match_fixture_id} onChange={(e) => setForm({ ...form, match_fixture_id: e.target.value })} required>
                                <NativeSelectOption value="">Select fixture</NativeSelectOption>
                                {fixtures.map((fixture) => (
                                    <NativeSelectOption key={fixture.id} value={fixture.id}>
                                        #{fixture.id} {fixture.home_club?.name} vs {fixture.away_club?.name}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
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
                        <Field ><FieldLabel>Season</FieldLabel>
                            <NativeSelect className="w-full" value={form.season_id} onChange={(e) => setForm({ ...form, season_id: e.target.value })}>
                                <NativeSelectOption value="">None</NativeSelectOption>
                                {seasons.map((season) => (
                                    <NativeSelectOption key={season.id} value={season.id}>
                                        {season.name}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field ><FieldLabel>Points reward</FieldLabel>
                            <Input type="number" min="1" value={form.points_reward} onChange={(e) => setForm({ ...form, points_reward: e.target.value })} required />
                        </Field>
                        <Field ><FieldLabel>Closes at</FieldLabel>
                            <Input type="datetime-local" value={form.closes_at} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} required />
                        </Field>
                    </div>
                    {editing && (
                        <Field ><FieldLabel>Correct choice (resolve)</FieldLabel>
                            <NativeSelect className="w-full" value={form.correct_choice} onChange={(e) => setForm({ ...form, correct_choice: e.target.value })}>
                                <NativeSelectOption value="">Unresolved</NativeSelectOption>
                                {choices.map((choice) => (
                                    <NativeSelectOption key={choice} value={choice}>
                                        {choice}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                    )}
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
