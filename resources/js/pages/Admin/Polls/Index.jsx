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

export default function PollsIndex({ polls, filters = {}, fandoms = [], seasons = [] }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        question: '',
        fandom_id: '',
        season_id: '',
        is_active: true,
        closes_at: '',
        optionsText: 'Yes\nNo',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setEditing(null);
        setForm({ question: '', fandom_id: '', season_id: '', is_active: true, closes_at: '', optionsText: 'Yes\nNo' });
        setError('');
        setOpen(true);
    }

    function openEdit(poll) {
        setEditing(poll);
        setForm({
            question: poll.question,
            fandom_id: poll.fandom_id ? String(poll.fandom_id) : '',
            season_id: poll.season_id ? String(poll.season_id) : '',
            is_active: Boolean(poll.is_active),
            closes_at: poll.closes_at ? String(poll.closes_at).slice(0, 16) : '',
            optionsText: '',
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
                await adminApi(`/polls/${editing.id}`, {
                    method: 'PUT',
                    body: {
                        question: form.question,
                        fandom_id: form.fandom_id || null,
                        season_id: form.season_id || null,
                        is_active: form.is_active,
                        closes_at: form.closes_at || null,
                    },
                });
            } else {
                const options = form.optionsText
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean);
                await adminApi('/polls', {
                    method: 'POST',
                    body: {
                        question: form.question,
                        fandom_id: form.fandom_id || null,
                        season_id: form.season_id || null,
                        is_active: form.is_active,
                        closes_at: form.closes_at || null,
                        options,
                    },
                });
            }
            setOpen(false);
            router.reload({ only: ['polls'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function remove(poll) {
        if (!confirm('Delete this poll?')) return;
        await adminApi(`/polls/${poll.id}`, { method: 'DELETE' });
        router.reload({ only: ['polls'] });
    }

    const rows = (polls?.data ?? []).map((poll) => ({
        ...poll,
        fandom: poll.fandom?.name ?? '—',
        options: (poll.options ?? []).map((option) => option.label).join(', '),
        votes: poll.votes_count ?? 0,
        status: poll.is_active ? <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Active</Badge> : <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">Inactive</Badge>,
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(poll)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => remove(poll)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Polls">
            <AdminPageHeader
                title="Polls"
                description="Fandom and season polls for fan engagement."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New poll
                    </Button>
                }
            />
            <AdminTable
                columns={[
                    { key: 'question', label: 'Question' },
                    { key: 'fandom', label: 'Fandom' },
                    { key: 'options', label: 'Options' },
                    { key: 'votes', label: 'Votes' },
                    { key: 'status', label: 'Status' },
                    { key: 'actions', label: '' },
                ]}
                rows={rows}
            />
            <AdminPagination links={polls?.links} meta={polls} />
            <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editing ? 'Edit poll' : 'Create poll'}</DialogTitle></DialogHeader>
                <form onSubmit={save} className="space-y-3">
                    <Field ><FieldLabel>Question</FieldLabel>
                        <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
                    </Field>
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
                    {!editing && (
                        <Field ><FieldLabel>Options (one per line)</FieldLabel>
                            <Textarea value={form.optionsText} onChange={(e) => setForm({ ...form, optionsText: e.target.value })} rows={4} required />
                        </Field>
                    )}
                    <Field ><FieldLabel>Closes at</FieldLabel>
                        <Input
                            type="datetime-local"
                            value={form.closes_at}
                            onChange={(e) => setForm({ ...form, closes_at: e.target.value })}
                            required
                        />
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                        Active
                    </label>
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
