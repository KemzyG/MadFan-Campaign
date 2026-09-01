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
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';

export default function ChannelsIndex({ channels, filters = {}, clubServers = [], types = [] }) {
    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        club_server_id: '',
        name: '',
        slug: '',
        type: types[0] ?? 'text',
        topic: '',
        position: 0,
        is_read_only: false,
        created_by_id: auth?.user?.id ?? '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setEditing(null);
        setForm({
            club_server_id: clubServers[0] ? String(clubServers[0].id) : '',
            name: '',
            slug: '',
            type: types[0] ?? 'text',
            topic: '',
            position: 0,
            is_read_only: false,
            created_by_id: auth?.user?.id ?? '',
        });
        setError('');
        setOpen(true);
    }

    function openEdit(channel) {
        setEditing(channel);
        setForm({
            club_server_id: String(channel.club_server_id),
            name: channel.name ?? '',
            slug: channel.slug ?? '',
            type: channel.type,
            topic: channel.topic ?? '',
            position: channel.position ?? 0,
            is_read_only: Boolean(channel.is_read_only),
            created_by_id: channel.created_by_id,
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
                club_server_id: Number(form.club_server_id),
                position: Number(form.position),
                created_by_id: form.created_by_id ? Number(form.created_by_id) : null,
                slug: form.slug || undefined,
            };
            if (editing) await adminApi(`/channels/${editing.id}`, { method: 'PUT', body: payload });
            else await adminApi('/channels', { method: 'POST', body: payload });
            setOpen(false);
            router.reload({ only: ['channels'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function remove(channel) {
        if (!confirm(`Delete channel “${channel.name}”?`)) return;
        await adminApi(`/channels/${channel.id}`, { method: 'DELETE' });
        router.reload({ only: ['channels'] });
    }

    const rows = (channels?.data ?? []).map((channel) => ({
        ...channel,
        club: channel.club_server?.club?.name ?? '—',
        members: channel.memberships_count ?? 0,
        messages: channel.messages_count ?? 0,
        readonly: channel.is_read_only ? <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">Read-only</Badge> : '—',
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(channel)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => remove(channel)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Channels">
            <AdminPageHeader
                title="Channels"
                description="Club chat channels and conversation rooms."
                actions={
                    <Button type="button" onClick={openCreate} disabled={clubServers.length === 0}>
                        New channel
                    </Button>
                }
            />
            {clubServers.length === 0 && (
                <p className="mb-4 text-sm text-muted-foreground">Create a club server before adding channels.</p>
            )}
            <AdminTable
                columns={[
                    { key: 'name', label: 'Channel' },
                    { key: 'club', label: 'Club' },
                    { key: 'type', label: 'Type' },
                    { key: 'members', label: 'Members' },
                    { key: 'messages', label: 'Messages' },
                    { key: 'readonly', label: 'Mode' },
                    { key: 'actions', label: '' },
                ]}
                rows={rows}
            />
            <AdminPagination links={channels?.links} meta={channels} />
            <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editing ? 'Edit channel' : 'Create channel'}</DialogTitle></DialogHeader>
                <form onSubmit={save} className="space-y-3">
                    {!editing && (
                        <Field ><FieldLabel>Club server</FieldLabel>
                            <NativeSelect className="w-full" value={form.club_server_id} onChange={(e) => setForm({ ...form, club_server_id: e.target.value })} required>
                                {clubServers.map((server) => (
                                    <NativeSelectOption key={server.id} value={server.id}>
                                        {server.club?.name ?? `Server #${server.id}`}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                    )}
                    <Field ><FieldLabel>Name</FieldLabel>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Topic</FieldLabel>
                        <Textarea value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} rows={2} />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field ><FieldLabel>Type</FieldLabel>
                            <NativeSelect className="w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                {types.map((type) => (
                                    <NativeSelectOption key={type} value={type}>
                                        {type}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                        <Field ><FieldLabel>Position</FieldLabel>
                            <Input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                        </Field>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_read_only} onChange={(e) => setForm({ ...form, is_read_only: e.target.checked })} />
                        Read-only
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
