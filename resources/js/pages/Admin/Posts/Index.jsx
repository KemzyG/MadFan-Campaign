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

export default function PostsIndex({ posts, filters = {}, clubs = [], types = [], visibilities = [] }) {
    const { auth } = usePage().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        author_id: auth?.user?.id ?? '',
        club_id: '',
        type: 'status',
        visibility: 'public',
        body: '',
        is_hidden: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');

    function openCreate() {
        setEditing(null);
        setForm({
            author_id: auth?.user?.id ?? '',
            club_id: '',
            type: 'status',
            visibility: 'public',
            body: '',
            is_hidden: false,
        });
        setError('');
        setModalOpen(true);
    }

    function openEdit(post) {
        setEditing(post);
        setForm({
            author_id: post.author_id,
            club_id: post.club_id ? String(post.club_id) : '',
            type: post.type,
            visibility: post.visibility,
            body: post.body ?? '',
            is_hidden: Boolean(post.is_hidden),
        });
        setError('');
        setModalOpen(true);
    }

    async function save(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                ...form,
                club_id: form.club_id || null,
                author_id: Number(form.author_id),
            };
            if (editing) {
                await adminApi(`/posts/${editing.id}`, { method: 'PUT', body: payload });
            } else {
                await adminApi('/posts', { method: 'POST', body: payload });
            }
            setModalOpen(false);
            router.reload({ only: ['posts'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function remove(post) {
        if (!confirm('Delete this post?')) return;
        await adminApi(`/posts/${post.id}`, { method: 'DELETE' });
        router.reload({ only: ['posts'] });
    }

    const rows = (posts?.data ?? []).map((post) => ({
        ...post,
        author: post.author?.name ?? '—',
        club: post.club?.name ?? '—',
        body: <span className="line-clamp-2 max-w-xs text-sm">{post.body || '—'}</span>,
        status: post.is_hidden ? <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">Hidden</Badge> : <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Visible</Badge>,
        counts: `${post.likes_count ?? 0} likes · ${post.media_count ?? 0} media`,
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(post)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => remove(post)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Posts">
            <AdminPageHeader
                title="Posts"
                description="Moderate and manage social feed posts."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New post
                    </Button>
                }
            />
            <div className="mb-4 flex gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search body or author" />
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
                    { key: 'id', label: 'ID' },
                    { key: 'author', label: 'Author' },
                    { key: 'body', label: 'Body' },
                    { key: 'club', label: 'Club' },
                    { key: 'type', label: 'Type' },
                    { key: 'status', label: 'Status' },
                    { key: 'counts', label: 'Engagement' },
                    { key: 'actions', label: '' },
                ]}
                rows={rows}
            />
            <AdminPagination links={posts?.links} meta={posts} />
            <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editing ? 'Edit post' : 'Create post'}</DialogTitle></DialogHeader>
                <form onSubmit={save} className="space-y-3">
                    <Field ><FieldLabel>Body</FieldLabel>
                        <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} />
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
                        <Field ><FieldLabel>Visibility</FieldLabel>
                            <NativeSelect className="w-full" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                                {visibilities.map((visibility) => (
                                    <NativeSelectOption key={visibility} value={visibility}>
                                        {visibility}
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
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_hidden} onChange={(e) => setForm({ ...form, is_hidden: e.target.checked })} />
                        Hidden from feed
                    </label>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
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
