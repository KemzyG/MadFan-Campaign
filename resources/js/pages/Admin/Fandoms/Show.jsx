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
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';
import { formatNumber } from '../../../lib/format';

function MetricCard({ label, value, hint }) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{formatNumber(value)}</div>
            {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
    );
}

const emptySubsetForm = () => ({
    name: '',
    slug: '',
    fan_count: 0,
    sort_order: 0,
    is_trending: false,
    imageFile: null,
    remove_image: false,
});

function subsetToForm(subset) {
    return {
        name: subset.name ?? '',
        slug: subset.slug ?? '',
        fan_count: subset.fan_count ?? 0,
        sort_order: subset.sort_order ?? 0,
        is_trending: Boolean(subset.is_trending),
        imageFile: null,
        remove_image: false,
        image_url: subset.image_url ?? null,
    };
}

export default function FandomShow({ fandom, analytics, groups = [] }) {
    const page = usePage();
    const [profileForm, setProfileForm] = useState({
        name: fandom.name ?? '',
        slug: fandom.slug ?? '',
        description: fandom.description ?? '',
        group: fandom.group ?? '',
        icon: fandom.icon ?? '',
        is_active: Boolean(fandom.is_active),
        coverFile: null,
        remove_cover: false,
    });
    const [profileError, setProfileError] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);

    const [subsetModalOpen, setSubsetModalOpen] = useState(false);
    const [editingSubsetId, setEditingSubsetId] = useState(null);
    const [subsetForm, setSubsetForm] = useState(emptySubsetForm);
    const [subsetError, setSubsetError] = useState('');
    const [subsetLoading, setSubsetLoading] = useState(false);

    async function saveProfile(e) {
        e.preventDefault();
        setProfileError('');
        setProfileLoading(true);
        try {
            const data = new FormData();
            data.append('_method', 'PUT');
            data.append('name', profileForm.name);
            data.append('slug', profileForm.slug);
            data.append('description', profileForm.description);
            if (profileForm.group) {
                data.append('group', profileForm.group);
            }
            data.append('icon', profileForm.icon);
            data.append('is_active', profileForm.is_active ? '1' : '0');
            if (profileForm.coverFile) {
                data.append('cover_image', profileForm.coverFile);
            }
            if (profileForm.remove_cover) {
                data.append('remove_cover_image', '1');
            }
            await adminApi(`/fandoms/${fandom.id}`, { method: 'POST', body: data });
            router.reload();
        } catch (err) {
            setProfileError(err.message);
        } finally {
            setProfileLoading(false);
        }
    }

    function openCreateSubset() {
        setEditingSubsetId(null);
        setSubsetForm({ ...emptySubsetForm(), sort_order: fandom.subsets?.length ?? 0 });
        setSubsetError('');
        setSubsetModalOpen(true);
    }

    function openEditSubset(subset) {
        setEditingSubsetId(subset.id);
        setSubsetForm(subsetToForm(subset));
        setSubsetError('');
        setSubsetModalOpen(true);
    }

    async function saveSubset(e) {
        e.preventDefault();
        setSubsetError('');
        setSubsetLoading(true);
        try {
            const data = new FormData();
            data.append('name', subsetForm.name);
            if (subsetForm.slug) {
                data.append('slug', subsetForm.slug);
            }
            data.append('fan_count', String(subsetForm.fan_count ?? 0));
            data.append('sort_order', String(subsetForm.sort_order ?? 0));
            data.append('is_trending', subsetForm.is_trending ? '1' : '0');
            if (subsetForm.imageFile) {
                data.append('image', subsetForm.imageFile);
            }
            if (subsetForm.remove_image) {
                data.append('remove_image', '1');
            }
            if (editingSubsetId) {
                data.append('_method', 'PUT');
                await adminApi(`/fandoms/${fandom.id}/subsets/${editingSubsetId}`, { method: 'POST', body: data });
            } else {
                await adminApi(`/fandoms/${fandom.id}/subsets`, { method: 'POST', body: data });
            }
            setSubsetModalOpen(false);
            router.reload();
        } catch (err) {
            setSubsetError(err.message);
        } finally {
            setSubsetLoading(false);
        }
    }

    async function deleteSubset(subset) {
        if (!confirm(`Delete subset “${subset.name}”?`)) {
            return;
        }
        try {
            await adminApi(`/fandoms/${fandom.id}/subsets/${subset.id}`, { method: 'DELETE' });
            router.reload();
        } catch (err) {
            alert(err.message);
        }
    }

    const subsetColumns = [
        { key: 'image', label: '' },
        { key: 'name', label: 'Subset' },
        { key: 'fans', label: 'Fans' },
        { key: 'order', label: 'Order' },
        { key: 'trending', label: 'Trending' },
        { key: 'actions', label: '' },
    ];

    const subsetRows = (fandom.subsets ?? []).map((subset) => ({
        ...subset,
        image: subset.image_url ? (
            <img src={subset.image_url} alt="" className="h-8 w-8 rounded object-cover" />
        ) : (
            '—'
        ),
        fans: subset.fan_count ?? 0,
        order: subset.sort_order ?? 0,
        trending: subset.is_trending ? <Badge>Trending</Badge> : '—',
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEditSubset(subset)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => deleteSubset(subset)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    const leagueColumns = [
        { key: 'name', label: 'League' },
        { key: 'short', label: 'Short' },
        { key: 'clubs', label: 'Clubs' },
    ];

    const leagueRows = (fandom.leagues ?? []).map((league) => ({
        ...league,
        clubs: league.clubs_count ?? 0,
    }));

    return (
        <AdminLayout title={fandom.name}>
            <AdminPageHeader
                title={fandom.name}
                description={`Fandom profile · /${fandom.slug}`}
                actions={
                    <Button variant="outline" render={<Link href={adminPath(page.props, 'fandoms')} />}>
                        ← All fandoms
                    </Button>
                }
            />

            <div className="mb-6 flex flex-wrap items-start gap-4">
                {fandom.cover_image_url ? (
                    <img src={fandom.cover_image_url} alt="" className="h-24 w-24 rounded-xl object-cover" />
                ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted text-3xl">{fandom.icon || '◉'}</div>
                )}
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        {fandom.group ? <Badge variant="secondary">{fandom.group}</Badge> : null}
                        {fandom.is_active ? <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Active</Badge> : <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">Inactive</Badge>}
                    </div>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{fandom.description || 'No description yet.'}</p>
                </div>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MetricCard label="Followers" value={analytics.followers} hint="Fandom follows" />
                <MetricCard label="Leagues" value={analytics.leagues} hint="Linked competitions" />
                <MetricCard label="Subsets" value={analytics.subsets} hint="Discovery browse nodes" />
                <MetricCard label="Votes" value={analytics.polls} hint="Active fan votes" />
                <MetricCard label="Products" value={analytics.products} hint="Shop catalog items" />
                <MetricCard label="Predictions" value={analytics.predictions} hint="Prediction games" />
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
                <section className="rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="text-sm font-semibold">Profile & media</h2>
                    <form onSubmit={saveProfile} className="mt-4 space-y-3">
                        <Field ><FieldLabel>Name</FieldLabel>
                            <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
                        </Field>
                        <Field ><FieldLabel>Slug</FieldLabel>
                            <Input value={profileForm.slug} onChange={(e) => setProfileForm({ ...profileForm, slug: e.target.value })} required />
                        </Field>
                        <Field ><FieldLabel>Description</FieldLabel>
                            <Textarea value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} rows={4} />
                        </Field>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field ><FieldLabel>Group</FieldLabel>
                                <NativeSelect className="w-full" value={profileForm.group} onChange={(e) => setProfileForm({ ...profileForm, group: e.target.value })}>
                                    <NativeSelectOption value="">None</NativeSelectOption>
                                    {groups.map((group) => (
                                        <NativeSelectOption key={group} value={group}>
                                            {group}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </Field>
                            <Field ><FieldLabel>Icon</FieldLabel>
                                <Input value={profileForm.icon} onChange={(e) => setProfileForm({ ...profileForm, icon: e.target.value })} />
                            </Field>
                        </div>
                        <Field ><FieldLabel>Cover image</FieldLabel>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setProfileForm({ ...profileForm, coverFile: e.target.files?.[0] ?? null, remove_cover: false })}
                                className="block w-full text-sm"
                            />
                            {fandom.cover_image_url && !profileForm.coverFile && !profileForm.remove_cover && (
                                <Button type="button" variant="link" size="sm" className="mt-2 text-destructive" onClick={() => setProfileForm({ ...profileForm, remove_cover: true })}>
                                    Remove current cover
                                </Button>
                            )}
                        </Field>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={profileForm.is_active} onChange={(e) => setProfileForm({ ...profileForm, is_active: e.target.checked })} />
                            Active
                        </label>
                        {profileError && <p className="text-sm text-destructive">{profileError}</p>}
                        <Button type="submit" disabled={profileLoading}>
                            {profileLoading ? 'Saving…' : 'Save profile'}
                        </Button>
                    </form>
                </section>

                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Subsets</h2>
                        <Button type="button" variant="outline" size="sm" onClick={openCreateSubset}>
                            Add subset
                        </Button>
                    </div>
                    <AdminTable columns={subsetColumns} rows={subsetRows} />
                </section>
            </div>

            <section className="mt-8">
                <h2 className="mb-3 text-sm font-semibold">Related leagues</h2>
                {(fandom.leagues ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No leagues linked to this fandom yet.</p>
                ) : (
                    <AdminTable columns={leagueColumns} rows={leagueRows} />
                )}
            </section>

            <Dialog open={subsetModalOpen} onOpenChange={setSubsetModalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editingSubsetId ? 'Edit subset' : 'Add subset'}</DialogTitle></DialogHeader>
                <form onSubmit={saveSubset} className="space-y-3">
                    <Field ><FieldLabel>Name</FieldLabel>
                        <Input value={subsetForm.name} onChange={(e) => setSubsetForm({ ...subsetForm, name: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Slug (optional)</FieldLabel>
                        <Input value={subsetForm.slug} onChange={(e) => setSubsetForm({ ...subsetForm, slug: e.target.value })} />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field ><FieldLabel>Fan count</FieldLabel>
                            <Input type="number" min="0" value={subsetForm.fan_count} onChange={(e) => setSubsetForm({ ...subsetForm, fan_count: Number(e.target.value) })} />
                        </Field>
                        <Field ><FieldLabel>Sort order</FieldLabel>
                            <Input type="number" min="0" value={subsetForm.sort_order} onChange={(e) => setSubsetForm({ ...subsetForm, sort_order: Number(e.target.value) })} />
                        </Field>
                    </div>
                    <Field ><FieldLabel>Image</FieldLabel>
                        <input type="file" accept="image/*" onChange={(e) => setSubsetForm({ ...subsetForm, imageFile: e.target.files?.[0] ?? null, remove_image: false })} className="block w-full text-sm" />
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={subsetForm.is_trending} onChange={(e) => setSubsetForm({ ...subsetForm, is_trending: e.target.checked })} />
                        Trending
                    </label>
                    {subsetError && <p className="text-sm text-destructive">{subsetError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setSubsetModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={subsetLoading}>
                            {subsetLoading ? 'Saving…' : editingSubsetId ? 'Save' : 'Create'}
                        </Button>
                    </div>
                </form>
            </DialogContent></Dialog>
        </AdminLayout>
    );
}
