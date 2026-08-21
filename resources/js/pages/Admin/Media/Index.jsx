import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Modal from '../../../Components/Admin/Modal';
import { FormField, FormInput, FormSelect, FormTextarea } from '../../../Components/Admin/FormField';
import AdminLayout from '../../../Layouts/AdminLayout';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';
import { usePage } from '@inertiajs/react';

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
            <PageHeader
                title="Media gallery"
                description={storageHint}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setError('');
                                setForm(emptyEdit());
                                setUploadOpen(true);
                            }}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                        >
                            Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setError('');
                                setPrompt('');
                                setGenTitle('');
                                setGenerateOpen(true);
                            }}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200"
                        >
                            Generate with AI
                        </button>
                    </div>
                }
            />

            <div className="mb-4 flex flex-wrap gap-3">
                <FormInput
                    placeholder="Search title, alt, prompt…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            applyFilters({ q: e.currentTarget.value });
                        }
                    }}
                />
                <FormSelect
                    value={sourceFilter}
                    onChange={(e) => {
                        setSourceFilter(e.target.value);
                        applyFilters({ source: e.target.value || undefined });
                    }}
                >
                    <option value="">All sources</option>
                    <option value="upload">Uploaded</option>
                    <option value="generated">AI generated</option>
                </FormSelect>
                <button
                    type="button"
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300"
                    onClick={() => applyFilters()}
                >
                    Search
                </button>
            </div>

            {(assets?.data ?? []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-500">
                    No media yet. Upload from your device or generate from a prompt.
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {(assets?.data ?? []).map((asset) => (
                        <article
                            key={asset.id}
                            className="overflow-hidden rounded-xl border border-white/10 bg-surface-800/60"
                        >
                            <div className="aspect-[4/5] bg-black/30">
                                <img src={asset.url} alt={asset.alt_text || ''} className="h-full w-full object-cover" />
                            </div>
                            <div className="space-y-2 p-3">
                                <p className="truncate text-sm font-medium text-zinc-100">
                                    {asset.title || `Asset #${asset.id}`}
                                </p>
                                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                                    {asset.source_label}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="text-xs text-brand-300"
                                        onClick={() => openEdit(asset)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs text-red-400"
                                        onClick={() => deleteAsset(asset)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <Pagination paginator={assets} />

            <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload media">
                <form onSubmit={uploadAsset} className="space-y-4">
                    {error ? <p className="text-sm text-red-400">{error}</p> : null}
                    <FormField label="Title">
                        <FormInput
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Alt text">
                        <FormInput
                            value={form.alt_text}
                            onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Image">
                        <input
                            type="file"
                            accept="image/*"
                            required
                            onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                        />
                    </FormField>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setUploadOpen(false)}
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                        >
                            {loading ? 'Uploading…' : 'Upload'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate with AI">
                <form onSubmit={generateAsset} className="space-y-4">
                    {error ? <p className="text-sm text-red-400">{error}</p> : null}
                    {!cloudinary.generation_available ? (
                        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                            Generation needs Cloudinary credentials and the Image Generation add-on. Uploads still
                            work without it.
                        </p>
                    ) : null}
                    <FormField label="Prompt">
                        <FormTextarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                            required
                            placeholder="Stadium kit flat-lay, navy and gold, soft daylight, product photography…"
                        />
                    </FormField>
                    <FormField label="Title (optional)">
                        <FormInput value={genTitle} onChange={(e) => setGenTitle(e.target.value)} />
                    </FormField>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setGenerateOpen(false)}
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                        >
                            {loading ? 'Generating…' : 'Generate'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={Boolean(editAsset)} onClose={() => setEditAsset(null)} title="Edit media">
                <form onSubmit={saveEdit} className="space-y-4">
                    {error ? <p className="text-sm text-red-400">{error}</p> : null}
                    {editAsset?.url ? (
                        <img src={editAsset.url} alt="" className="h-40 w-full rounded-lg object-cover" />
                    ) : null}
                    <FormField label="Title">
                        <FormInput
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Alt text">
                        <FormInput
                            value={form.alt_text}
                            onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Replace image (optional)">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                        />
                    </FormField>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setEditAsset(null)}
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                        >
                            {loading ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
