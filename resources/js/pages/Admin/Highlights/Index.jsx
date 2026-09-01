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

export default function HighlightsIndex({ highlights, filters = {}, clubs = [] }) {
    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        author_id: auth?.user?.id ?? '',
        club_id: '',
        title: '',
        caption: '',
        video_url: '',
        thumbnail_url: '',
        duration_seconds: '',
        is_featured: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setEditing(null);
        setForm({
            author_id: auth?.user?.id ?? '',
            club_id: '',
            title: '',
            caption: '',
            video_url: '',
            thumbnail_url: '',
            duration_seconds: '',
            is_featured: false,
        });
        setError('');
        setOpen(true);
    }

    function openEdit(item) {
        setEditing(item);
        setForm({
            author_id: item.author_id,
            club_id: item.club_id ? String(item.club_id) : '',
            title: item.title ?? '',
            caption: item.caption ?? '',
            video_url: item.video_url ?? '',
            thumbnail_url: item.thumbnail_url ?? '',
            duration_seconds: item.duration_seconds ?? '',
            is_featured: Boolean(item.is_featured),
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
                author_id: Number(form.author_id),
                club_id: form.club_id || null,
                duration_seconds: form.duration_seconds === '' ? null : Number(form.duration_seconds),
                thumbnail_url: form.thumbnail_url || null,
            };
            if (editing) await adminApi(`/highlights/${editing.id}`, { method: 'PUT', body: payload });
            else await adminApi('/highlights', { method: 'POST', body: payload });
            setOpen(false);
            router.reload({ only: ['highlights'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function remove(item) {
        if (!confirm(`Delete highlight “${item.title}”?`)) return;
        await adminApi(`/highlights/${item.id}`, { method: 'DELETE' });
        router.reload({ only: ['highlights'] });
    }

    const rows = (highlights?.data ?? []).map((item) => ({
        ...item,
        author: item.author?.name ?? '—',
        club: item.club?.name ?? '—',
        featured: item.is_featured ? <Badge>Featured</Badge> : '—',
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
        <AdminLayout title="Highlights">
            <AdminPageHeader
                title="Video highlights"
                description="Manage short-form highlight videos for the social app."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New highlight
                    </Button>
                }
            />
            <AdminTable
                columns={[
                    { key: 'title', label: 'Title' },
                    { key: 'author', label: 'Author' },
                    { key: 'club', label: 'Club' },
                    { key: 'featured', label: 'Featured' },
                    { key: 'views_count', label: 'Views' },
                    { key: 'actions', label: '' },
                ]}
                rows={rows}
            />
            <AdminPagination links={highlights?.links} meta={highlights} />
            <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editing ? 'Edit highlight' : 'Create highlight'}</DialogTitle></DialogHeader>
                <form onSubmit={save} className="space-y-3">
                    <Field ><FieldLabel>Title</FieldLabel>
                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Caption</FieldLabel>
                        <Textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} rows={2} />
                    </Field>
                    <Field ><FieldLabel>Video URL</FieldLabel>
                        <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Thumbnail URL</FieldLabel>
                        <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
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
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                        Featured
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
