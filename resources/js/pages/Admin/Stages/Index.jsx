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
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';

export default function StagesIndex({ stages, filters = {}, clubs = [], statuses = [], types = [] }) {
    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        host_id: auth?.user?.id ?? '',
        club_id: '',
        title: '',
        type: types[0] ?? 'voice',
        description: '',
        status: 'live',
        is_public: true,
        allow_chat: true,
        voice_enabled: true,
        max_speakers: 8,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');

    function openCreate() {
        setEditing(null);
        setForm({
            host_id: auth?.user?.id ?? '',
            club_id: '',
            title: '',
            type: types[0] ?? 'voice',
            description: '',
            status: 'live',
            is_public: true,
            allow_chat: true,
            voice_enabled: true,
            max_speakers: 8,
        });
        setError('');
        setOpen(true);
    }

    function openEdit(stage) {
        setEditing(stage);
        setForm({
            host_id: stage.host_id,
            club_id: stage.club_id ? String(stage.club_id) : '',
            title: stage.title ?? '',
            type: stage.type,
            description: stage.description ?? '',
            status: stage.status,
            is_public: Boolean(stage.is_public),
            allow_chat: Boolean(stage.allow_chat),
            voice_enabled: Boolean(stage.voice_enabled),
            max_speakers: stage.max_speakers ?? 8,
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
                host_id: Number(form.host_id),
                club_id: form.club_id || null,
                max_speakers: Number(form.max_speakers),
            };
            if (editing) await adminApi(`/stages/${editing.id}`, { method: 'PUT', body: payload });
            else await adminApi('/stages', { method: 'POST', body: payload });
            setOpen(false);
            router.reload({ only: ['stages'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function remove(stage) {
        if (!confirm(`Delete stage “${stage.title}”?`)) return;
        await adminApi(`/stages/${stage.id}`, { method: 'DELETE' });
        router.reload({ only: ['stages'] });
    }

    const rows = (stages?.data ?? []).map((stage) => ({
        ...stage,
        host: stage.host?.name ?? '—',
        club: stage.club?.name ?? '—',
        people: stage.participants_count ?? 0,
        statusBadge: <Badge variant={adminBadgeVariant(stage.status === 'live' ? 'success' : 'warning')} className={adminBadgeClass(stage.status === 'live' ? 'success' : 'warning')}>{stage.status}</Badge>,
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(stage)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => remove(stage)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Stages">
            <AdminPageHeader
                title="Stages"
                description="Voice / video rooms for club communities."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New stage
                    </Button>
                }
            />
            <div className="mb-4 flex gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title" />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.get(window.location.pathname, { search: search || undefined }, { preserveState: true, replace: true })}
                >
                    Search
                </Button>
            </div>
            <AdminTable
                columns={[
                    { key: 'title', label: 'Title' },
                    { key: 'host', label: 'Host' },
                    { key: 'club', label: 'Club' },
                    { key: 'type', label: 'Type' },
                    { key: 'people', label: 'People' },
                    { key: 'statusBadge', label: 'Status' },
                    { key: 'actions', label: '' },
                ]}
                rows={rows}
            />
            <AdminPagination links={stages?.links} meta={stages} />
            <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editing ? 'Edit stage' : 'Create stage'}</DialogTitle></DialogHeader>
                <form onSubmit={save} className="space-y-3">
                    <Field ><FieldLabel>Title</FieldLabel>
                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Description</FieldLabel>
                        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
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
                        <Field ><FieldLabel>Status</FieldLabel>
                            <NativeSelect className="w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                {statuses.map((status) => (
                                    <NativeSelectOption key={status} value={status}>
                                        {status}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                    </div>
                    <Field ><FieldLabel>Club</FieldLabel>
                        <NativeSelect className="w-full" value={form.club_id} onChange={(e) => setForm({ ...form, club_id: e.target.value })}>
                            <NativeSelectOption value="">None</NativeSelectOption>
                            {clubs.map((club) => (
                                <NativeSelectOption key={club.id} value={club.id}>
                                    {club.name}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </Field>
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
