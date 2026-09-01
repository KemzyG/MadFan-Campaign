import { AdminPageHeader } from '@/lib/admin-page-header';
import { AdminPagination } from '@/lib/admin-pagination';
import { AdminTable } from '@/lib/admin-table';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Field, FieldLabel } from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/Components/ui/native-select';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import UserSearchPicker from '@/Components/Admin/user-search-picker';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';
import { formatNumber } from '../../../lib/format';

const emptyForm = {
    title: '',
    fandom_id: '',
    season_id: '',
    contestant_a: null,
    contestant_b: null,
    is_active: true,
    closes_at: '',
};

export default function ShowdownsIndex({ showdowns, filters = {}, fandoms = [], seasons = [] }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setError('');
        setOpen(true);
    }

    function openEdit(showdown) {
        setEditing(showdown);
        setForm({
            title: showdown.title,
            fandom_id: showdown.fandom_id ? String(showdown.fandom_id) : '',
            season_id: showdown.season_id ? String(showdown.season_id) : '',
            contestant_a: showdown.contestant_a ?? null,
            contestant_b: showdown.contestant_b ?? null,
            is_active: Boolean(showdown.is_active),
            closes_at: showdown.closes_at ? String(showdown.closes_at).slice(0, 16) : '',
        });
        setError('');
        setOpen(true);
    }

    async function save(e) {
        e.preventDefault();

        if (!editing && (!form.contestant_a || !form.contestant_b)) {
            setError('Search for and select both contestants before saving.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const body = {
                title: form.title,
                fandom_id: form.fandom_id || null,
                season_id: form.season_id || null,
                is_active: form.is_active,
                closes_at: form.closes_at || null,
            };
            if (editing) {
                await adminApi(`/showdowns/${editing.id}`, { method: 'PUT', body });
            } else {
                await adminApi('/showdowns', {
                    method: 'POST',
                    body: {
                        ...body,
                        contestant_a_user_id: form.contestant_a.id,
                        contestant_b_user_id: form.contestant_b.id,
                    },
                });
            }
            setOpen(false);
            router.reload({ only: ['showdowns'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function remove(showdown) {
        if (!confirm('Delete this vote?')) return;
        await adminApi(`/showdowns/${showdown.id}`, { method: 'DELETE' });
        router.reload({ only: ['showdowns'] });
    }

    const rows = (showdowns?.data ?? []).map((showdown) => ({
        ...showdown,
        contestants: `${showdown.contestant_a?.name ?? 'A'} vs ${showdown.contestant_b?.name ?? 'B'}`,
        votes: `${formatNumber(showdown.votes_a ?? 0)} – ${formatNumber(showdown.votes_b ?? 0)}`,
        fandom: showdown.fandom?.name ?? '—',
        status: showdown.is_active ? (
            <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Active</Badge>
        ) : (
            <Badge variant="outline">Closed</Badge>
        ),
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(showdown)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => remove(showdown)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Vote">
            <AdminPageHeader
                title="Vote"
                description="Head-to-head fan votes — two fans compete, unlimited taps, side locks once picked. Appears on the Events feed as Fan showdown cards."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New vote
                    </Button>
                }
            />
            <AdminTable
                columns={[
                    { key: 'title', label: 'Title' },
                    { key: 'contestants', label: 'Contestants' },
                    { key: 'fandom', label: 'Fandom' },
                    { key: 'votes', label: 'Votes' },
                    { key: 'status', label: 'Status' },
                    { key: 'actions', label: '' },
                ]}
                rows={rows}
            />
            <AdminPagination links={showdowns?.links} meta={showdowns} />
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit vote' : 'Create vote'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={save} className="space-y-3">
                        <Field>
                            <FieldLabel>Title</FieldLabel>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        </Field>
                        {!editing && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <UserSearchPicker
                                    label="Contestant A"
                                    value={form.contestant_a}
                                    onChange={(user) => setForm({ ...form, contestant_a: user })}
                                    required
                                />
                                <UserSearchPicker
                                    label="Contestant B"
                                    value={form.contestant_b}
                                    onChange={(user) => setForm({ ...form, contestant_b: user })}
                                    required
                                />
                            </div>
                        )}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field>
                                <FieldLabel>Fandom</FieldLabel>
                                <NativeSelect className="w-full" value={form.fandom_id} onChange={(e) => setForm({ ...form, fandom_id: e.target.value })}>
                                    <NativeSelectOption value="">None</NativeSelectOption>
                                    {fandoms.map((fandom) => (
                                        <NativeSelectOption key={fandom.id} value={fandom.id}>{fandom.name}</NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </Field>
                            <Field>
                                <FieldLabel>Season</FieldLabel>
                                <NativeSelect className="w-full" value={form.season_id} onChange={(e) => setForm({ ...form, season_id: e.target.value })}>
                                    <NativeSelectOption value="">None</NativeSelectOption>
                                    {seasons.map((season) => (
                                        <NativeSelectOption key={season.id} value={season.id}>{season.name}</NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </Field>
                        </div>
                        <Field>
                            <FieldLabel>Closes at</FieldLabel>
                            <Input type="datetime-local" value={form.closes_at} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} />
                        </Field>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                            Active
                        </label>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
