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
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';

const emptyForm = () => ({
    name: '',
    slug: '',
    description: '',
    group: '',
    icon: '',
    is_active: true,
    coverFile: null,
    remove_cover: false,
});

function fandomToForm(fandom) {
    return {
        name: fandom.name ?? '',
        slug: fandom.slug ?? '',
        description: fandom.description ?? '',
        group: fandom.group ?? '',
        icon: fandom.icon ?? '',
        is_active: Boolean(fandom.is_active),
        coverFile: null,
        remove_cover: false,
        cover_image_url: fandom.cover_image_url ?? null,
    };
}

function buildPayload(form) {
    const data = new FormData();
    data.append('name', form.name);
    if (form.slug) {
        data.append('slug', form.slug);
    }
    data.append('description', form.description);
    if (form.group) {
        data.append('group', form.group);
    }
    data.append('icon', form.icon);
    data.append('is_active', form.is_active ? '1' : '0');
    if (form.coverFile) {
        data.append('cover_image', form.coverFile);
    }
    if (form.remove_cover) {
        data.append('remove_cover_image', '1');
    }

    return data;
}

export default function FandomsIndex({ fandoms, filters = {}, groups = [] }) {
    const page = usePage();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilters(next = {}) {
        router.get(
            window.location.pathname,
            {
                search: (next.search ?? search) || undefined,
                group: next.group ?? filters.group ?? undefined,
                is_active: next.is_active ?? filters.is_active ?? undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm());
        setError('');
        setModalOpen(true);
    }

    function openEdit(fandom) {
        setEditingId(fandom.id);
        setForm(fandomToForm(fandom));
        setError('');
        setModalOpen(true);
    }

    async function saveFandom(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload = buildPayload(form);
            if (editingId) {
                payload.append('_method', 'PUT');
                await adminApi(`/fandoms/${editingId}`, { method: 'POST', body: payload });
            } else {
                await adminApi('/fandoms', { method: 'POST', body: payload });
            }
            setModalOpen(false);
            router.reload({ only: ['fandoms'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteFandom(fandom) {
        if (!confirm(`Delete fandom “${fandom.name}”? Related leagues will lose their fandom link.`)) {
            return;
        }
        try {
            await adminApi(`/fandoms/${fandom.id}`, { method: 'DELETE' });
            router.reload({ only: ['fandoms'] });
        } catch (err) {
            alert(err.message);
        }
    }

    const columns = [
        { key: 'cover', label: '' },
        { key: 'name', label: 'Fandom' },
        { key: 'group', label: 'Group' },
        { key: 'followers', label: 'Followers' },
        { key: 'leagues', label: 'Leagues' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: '' },
    ];

    const rows = (fandoms?.data ?? []).map((fandom) => ({
        ...fandom,
        cover: fandom.cover_image_url ? (
            <img src={fandom.cover_image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                {fandom.icon || '◉'}
            </span>
        ),
        name: (
            <div>
                <Link href={adminPath(page.props, `fandoms/${fandom.id}`)} className="font-medium text-primary hover:underline">
                    {fandom.name}
                </Link>
                <div className="text-xs text-muted-foreground">/{fandom.slug}</div>
            </div>
        ),
        group: fandom.group ? <Badge variant="secondary">{fandom.group}</Badge> : '—',
        followers: fandom.follows_count ?? 0,
        leagues: fandom.leagues_count ?? 0,
        status: fandom.is_active ? <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Active</Badge> : <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">Inactive</Badge>,
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" render={<Link href={adminPath(page.props, `fandoms/${fandom.id}`)} />}>
                    Profile
                </Button>
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(fandom)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => deleteFandom(fandom)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Fandoms">
            <AdminPageHeader
                title="Fandoms"
                description="Top-level social categories — sports, esports, music, books."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New fandom
                    </Button>
                }
            />

            <div className="mb-4 flex flex-wrap items-end gap-3">
                <Field ><FieldLabel>Search</FieldLabel>
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Name or slug"
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                    />
                </Field>
                <Field ><FieldLabel>Group</FieldLabel>
                    <NativeSelect className="w-full"
                        value={filters.group ?? ''}
                        onChange={(e) => applyFilters({ group: e.target.value || null })}
                    >
                        <NativeSelectOption value="">All groups</NativeSelectOption>
                        {groups.map((group) => (
                            <NativeSelectOption key={group} value={group}>
                                {group}
                            </NativeSelectOption>
                        ))}
                    </NativeSelect>
                </Field>
                <Field ><FieldLabel>Status</FieldLabel>
                    <NativeSelect className="w-full"
                        value={filters.is_active === null || filters.is_active === undefined ? '' : filters.is_active ? '1' : '0'}
                        onChange={(e) =>
                            applyFilters({
                                is_active: e.target.value === '' ? null : e.target.value === '1',
                            })
                        }
                    >
                        <NativeSelectOption value="">All</NativeSelectOption>
                        <NativeSelectOption value="1">Active</NativeSelectOption>
                        <NativeSelectOption value="0">Inactive</NativeSelectOption>
                    </NativeSelect>
                </Field>
                <Button type="button" variant="outline" onClick={() => applyFilters({ search })}>
                    Search
                </Button>
            </div>

            <AdminTable columns={columns} rows={rows} />
            <AdminPagination links={fandoms?.links} meta={fandoms} />

            <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editingId ? 'Edit fandom' : 'Create fandom'}</DialogTitle></DialogHeader>
                <form onSubmit={saveFandom} className="space-y-3">
                    <Field ><FieldLabel>Name</FieldLabel>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Slug (optional)</FieldLabel>
                        <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated from name" />
                    </Field>
                    <Field ><FieldLabel>Description</FieldLabel>
                        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field ><FieldLabel>Group</FieldLabel>
                            <NativeSelect className="w-full" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
                                <NativeSelectOption value="">None</NativeSelectOption>
                                {groups.map((group) => (
                                    <NativeSelectOption key={group} value={group}>
                                        {group}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                        <Field ><FieldLabel>Icon (emoji)</FieldLabel>
                            <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={16} placeholder="⚽" />
                        </Field>
                    </div>
                    <Field ><FieldLabel>Cover image</FieldLabel>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setForm({ ...form, coverFile: e.target.files?.[0] ?? null, remove_cover: false })}
                            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5"
                        />
                        {form.cover_image_url && !form.coverFile && !form.remove_cover && (
                            <div className="mt-2 flex items-center gap-3">
                                <img src={form.cover_image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                                <Button type="button" variant="link" size="sm" className="text-destructive" onClick={() => setForm({ ...form, remove_cover: true })}>
                                    Remove cover
                                </Button>
                            </div>
                        )}
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                        Active on social discovery
                    </label>
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
