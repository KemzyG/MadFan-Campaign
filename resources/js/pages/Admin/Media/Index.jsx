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
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';

const emptyEdit = () => ({ title: '', alt_text: '', imageFile: null });

export default function MediaIndex({ assets, filters = {}, cloudinary = {} }) {
    const page = usePage();
    const [uploadOpen, setUploadOpen] = useState(false);
    const [generateOpen, setGenerateOpen] = useState(false);
    const [editAsset, setEditAsset] = useState(null);
    const [form, setForm] = useState(emptyEdit);
    const [prompt, setPrompt] = useState('');
    const [genTitle, setGenTitle] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sourceFilter, setSourceFilter] = useState(filters.source ?? '');
    const [query, setQuery] = useState(filters.q ?? '');

    const storageHint = useMemo(() => {
        if (cloudinary.configured) {
            return cloudinary.generation_available
                ? 'Cloudinary upload + AI generation ready.'
                : 'Cloudinary upload ready. Enable the Image Generation add-on for prompt-based images.';
        }

        return 'Cloudinary not configured — uploads fall back to local public disk. AI generate requires Cloudinary credentials.';
    }, [cloudinary]);

    function applyFilters(next = {}) {
        router.get(
            adminPath(page.props, 'media'),
            {
                q: next.q ?? query ?? undefined,
                source: next.source ?? sourceFilter ?? undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    async function uploadAsset(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = new FormData();
            if (form.title) {
                data.append('title', form.title);
            }
            if (form.alt_text) {
                data.append('alt_text', form.alt_text);
            }
            if (form.imageFile) {
                data.append('image', form.imageFile);
            }
            await adminApi('/media-assets', { method: 'POST', body: data });
            setUploadOpen(false);
            setForm(emptyEdit());
            router.reload({ only: ['assets', 'cloudinary'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function generateAsset(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await adminApi('/media-assets/generate', {
                method: 'POST',
                body: {
                    prompt,
                    title: genTitle || undefined,
                },
            });
            setGenerateOpen(false);
            setPrompt('');
            setGenTitle('');
            router.reload({ only: ['assets', 'cloudinary'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function saveEdit(e) {
        e.preventDefault();
        if (!editAsset) {
            return;
        }
        setError('');
        setLoading(true);
        try {
            const data = new FormData();
            data.append('_method', 'PUT');
            data.append('title', form.title ?? '');
            data.append('alt_text', form.alt_text ?? '');
            if (form.imageFile) {
                data.append('image', form.imageFile);
            }
            await adminApi(`/media-assets/${editAsset.id}`, { method: 'POST', body: data });
            setEditAsset(null);
            setForm(emptyEdit());
            router.reload({ only: ['assets'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteAsset(asset) {
        if (!confirm(`Delete “${asset.title || `asset #${asset.id}`}”?`)) {
            return;
        }
        try {
            await adminApi(`/media-assets/${asset.id}`, { method: 'DELETE' });
            router.reload({ only: ['assets'] });
        } catch (err) {
            alert(err.message);
        }
    }

    function openEdit(asset) {
        setEditAsset(asset);
        setForm({
            title: asset.title ?? '',
            alt_text: asset.alt_text ?? '',
            imageFile: null,
        });
        setError('');
    }

    return (
        <AdminLayout title="Media gallery">
            <AdminPageHeader
                title="Media gallery"
                description={storageHint}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            onClick={() => {
                                setError('');
                                setForm(emptyEdit());
                                setUploadOpen(true);
                            }}
                        >
                            Upload
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setError('');
                                setPrompt('');
                                setGenTitle('');
                                setGenerateOpen(true);
                            }}
                        >
                            Generate with AI
                        </Button>
                    </div>
                }
            />

            <div className="mb-4 flex flex-wrap gap-3">
                <Input
                    placeholder="Search title, alt, prompt…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            applyFilters({ q: e.currentTarget.value });
                        }
                    }}
                />
                <NativeSelect className="w-full"
                    value={sourceFilter}
                    onChange={(e) => {
                        setSourceFilter(e.target.value);
                        applyFilters({ source: e.target.value || undefined });
                    }}
                >
                    <NativeSelectOption value="">All sources</NativeSelectOption>
                    <NativeSelectOption value="upload">Uploaded</NativeSelectOption>
                    <NativeSelectOption value="generated">AI generated</NativeSelectOption>
                </NativeSelect>
                <Button type="button" variant="outline" onClick={() => applyFilters()}>
                    Search
                </Button>
            </div>

            {(assets?.data ?? []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                    No media yet. Upload from your device or generate from a prompt.
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {(assets?.data ?? []).map((asset) => (
                        <Card key={asset.id} className="overflow-hidden py-0">
                            <div className="aspect-[4/5] bg-muted/30">
                                <img src={asset.url} alt={asset.alt_text || ''} className="h-full w-full object-cover" />
                            </div>
                            <CardContent className="space-y-2 p-3">
                                <p className="truncate text-sm font-medium">
                                    {asset.title || `Asset #${asset.id}`}
                                </p>
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    {asset.source_label}
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="link" size="sm" type="button" onClick={() => openEdit(asset)}>
                                        Edit
                                    </Button>
                                    <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => deleteAsset(asset)}>
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AdminPagination links={assets?.links} meta={assets} />

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Upload media</DialogTitle></DialogHeader>
                <form onSubmit={uploadAsset} className="space-y-4">
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    <Field ><FieldLabel>Title</FieldLabel>
                        <Input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </Field>
                    <Field ><FieldLabel>Alt text</FieldLabel>
                        <Input
                            value={form.alt_text}
                            onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
                        />
                    </Field>
                    <Field ><FieldLabel>Image</FieldLabel>
                        <input
                            type="file"
                            accept="image/*"
                            required
                            onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setUploadOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Uploading…' : 'Upload'}
                        </Button>
                    </div>
                </form>
            </DialogContent></Dialog>

            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Generate with AI</DialogTitle></DialogHeader>
                <form onSubmit={generateAsset} className="space-y-4">
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    {!cloudinary.generation_available ? (
                        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-200">
                            Generation needs Cloudinary credentials and the Image Generation add-on. Uploads still
                            work without it.
                        </p>
                    ) : null}
                    <Field ><FieldLabel>Prompt</FieldLabel>
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                            required
                            placeholder="Stadium kit flat-lay, navy and gold, soft daylight, product photography…"
                        />
                    </Field>
                    <Field ><FieldLabel>Title (optional)</FieldLabel>
                        <Input value={genTitle} onChange={(e) => setGenTitle(e.target.value)} />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setGenerateOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Generating…' : 'Generate'}
                        </Button>
                    </div>
                </form>
            </DialogContent></Dialog>

            <Dialog open={Boolean(editAsset)} onOpenChange={(open) => !open && setEditAsset(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Edit media</DialogTitle></DialogHeader>
                <form onSubmit={saveEdit} className="space-y-4">
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    {editAsset?.url ? (
                        <img src={editAsset.url} alt="" className="h-40 w-full rounded-lg object-cover" />
                    ) : null}
                    <Field ><FieldLabel>Title</FieldLabel>
                        <Input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </Field>
                    <Field ><FieldLabel>Alt text</FieldLabel>
                        <Input
                            value={form.alt_text}
                            onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
                        />
                    </Field>
                    <Field ><FieldLabel>Replace image (optional)</FieldLabel>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setEditAsset(null)}>
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
