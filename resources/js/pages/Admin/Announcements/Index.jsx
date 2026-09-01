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

const empty = () => ({
    type: 'concert',
    club_id: '',
    headline: '',
    subtitle: '',
    link_url: '',
    link_label: '',
    is_pinned: false,
    starts_at: '',
    ends_at: '',
    published_at: '',
    imageFile: null,
});

export default function AnnouncementsIndex({ announcements, filters = {}, clubs = [], types = [] }) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(empty);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setEditing(null);
        setForm({ ...empty(), type: types[0] ?? 'concert' });
        setError('');
        setOpen(true);
    }

    function openEdit(item) {
        setEditing(item);
        setForm({
            type: item.type,
            club_id: item.club_id ? String(item.club_id) : '',
            headline: item.headline ?? '',
            subtitle: item.subtitle ?? '',
            link_url: item.link_url ?? '',
            link_label: item.link_label ?? '',
            is_pinned: Boolean(item.is_pinned),
            starts_at: item.starts_at ? String(item.starts_at).slice(0, 16) : '',
            ends_at: item.ends_at ? String(item.ends_at).slice(0, 16) : '',
            published_at: item.published_at ? String(item.published_at).slice(0, 16) : '',
            imageFile: null,
        });
        setError('');
        setOpen(true);
    }

    async function save(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                if (key === 'imageFile') return;
                if (value === '' || value === null) return;
                data.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value);
            });
            if (form.imageFile) data.append('image', form.imageFile);
            if (editing) {
                data.append('_method', 'PUT');
                await adminApi(`/announcements/${editing.id}`, { method: 'POST', body: data });
            } else {
                await adminApi('/announcements', { method: 'POST', body: data });
            }
            setOpen(false);
            router.reload({ only: ['announcements'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function remove(item) {
        if (!confirm(`Delete “${item.headline}”?`)) return;
        await adminApi(`/announcements/${item.id}`, { method: 'DELETE' });
        router.reload({ only: ['announcements'] });
    }

    const rows = (announcements?.data ?? []).map((item) => ({
        ...item,
        club: item.club?.name ?? '—',
        pinned: item.is_pinned ? <Badge>Pinned</Badge> : '—',
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
        <AdminLayout title="Events">
            <AdminPageHeader
                title="Events / Announcements"
                description="Editorial social events: concerts, song releases, breaking news."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New event
                    </Button>
                }
            />
            <div className="mb-4">
                <NativeSelect className="w-full"
                    value={filters.type ?? ''}
                    onChange={(e) =>
                        router.get(window.location.pathname, { type: e.target.value || undefined }, { preserveState: true, replace: true })
                    }
                >
                    <NativeSelectOption value="">All types</NativeSelectOption>
                    {types.map((type) => (
                        <NativeSelectOption key={type} value={type}>
                            {type}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </div>
            <AdminTable
                columns={[
                    { key: 'type', label: 'Type' },
                    { key: 'headline', label: 'Headline' },
                    { key: 'club', label: 'Club' },
                    { key: 'pinned', label: 'Pinned' },
                    { key: 'actions', label: '' },
                ]}
                rows={rows}
            />
            <AdminPagination links={announcements?.links} meta={announcements} />
            <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editing ? 'Edit event' : 'Create event'}</DialogTitle></DialogHeader>
                <form onSubmit={save} className="space-y-3">
                    <Field ><FieldLabel>Type</FieldLabel>
                        <NativeSelect className="w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                            {types.map((type) => (
                                <NativeSelectOption key={type} value={type}>
                                    {type}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </Field>
                    <Field ><FieldLabel>Headline</FieldLabel>
                        <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Subtitle</FieldLabel>
                        <Textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} rows={2} />
                    </Field>
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
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field ><FieldLabel>Link URL</FieldLabel>
                            <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
                        </Field>
                        <Field ><FieldLabel>Link label</FieldLabel>
                            <Input value={form.link_label} onChange={(e) => setForm({ ...form, link_label: e.target.value })} />
                        </Field>
                    </div>
                    <Field ><FieldLabel>Image</FieldLabel>
                        <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })} />
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} />
                        Pinned
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
