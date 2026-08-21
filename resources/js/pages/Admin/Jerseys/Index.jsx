import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Modal from '../../../Components/Admin/Modal';
import { FormField, FormInput, FormSelect, FormTextarea } from '../../../Components/Admin/FormField';
import AdminLayout from '../../../Layouts/AdminLayout';
import DataTable from '../../../Components/DataTable';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';
import { usePage } from '@inertiajs/react';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const emptyVariant = () => ({ id: null, size: 'M', stock: 10, sku: '' });

const emptyForm = () => ({
    club_id: '',
    name: '',
    slug: '',
    description: '',
    price: '69.99',
    is_active: true,
    imageFile: null,
    remove_image: false,
    media_asset_ids: [],
    variants: [emptyVariant()],
});

function jerseyToForm(jersey) {
    return {
        club_id: jersey.club_id ? String(jersey.club_id) : '',
        name: jersey.name ?? '',
        slug: jersey.slug ?? '',
        description: jersey.description ?? '',
        price: jersey.price ?? '',
        is_active: Boolean(jersey.is_active),
        imageFile: null,
        remove_image: false,
        image_url: jersey.image_url ?? null,
        media_asset_ids: (jersey.media_asset_ids || []).map(Number),
        variants: (jersey.variants || []).map((variant) => ({
            id: variant.id,
            size: variant.size,
            stock: variant.stock,
            sku: variant.sku ?? '',
        })),
    };
}

function buildPayload(form) {
    const data = new FormData();
    if (form.club_id) {
        data.append('club_id', form.club_id);
    }
    data.append('name', form.name);
    if (form.slug) {
        data.append('slug', form.slug);
    }
    data.append('description', form.description ?? '');
    data.append('price', form.price);
    data.append('is_active', form.is_active ? '1' : '0');
    if (form.imageFile) {
        data.append('image', form.imageFile);
    }
    if (form.remove_image) {
        data.append('remove_image', '1');
    }
    data.append('sync_gallery', '1');
    form.media_asset_ids.forEach((id, index) => {
        data.append(`media_asset_ids[${index}]`, String(id));
    });
    form.variants.forEach((variant, index) => {
        if (variant.id) {
            data.append(`variants[${index}][id]`, String(variant.id));
        }
        data.append(`variants[${index}][size]`, variant.size);
        data.append(`variants[${index}][stock]`, String(variant.stock));
        if (variant.sku) {
            data.append(`variants[${index}][sku]`, variant.sku);
        }
    });

    return data;
}

export default function JerseysIndex({ jerseys, clubs = [], gallery_assets = [], filters = {} }) {
    const page = usePage();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pickerQuery, setPickerQuery] = useState('');

    const selectedSet = useMemo(() => new Set(form.media_asset_ids.map(Number)), [form.media_asset_ids]);

    const filteredGallery = useMemo(() => {
        const q = pickerQuery.trim().toLowerCase();
        if (!q) {
            return gallery_assets;
        }

        return gallery_assets.filter((asset) => {
            const hay = `${asset.title || ''} ${asset.alt_text || ''} ${asset.prompt || ''}`.toLowerCase();

            return hay.includes(q);
        });
    }, [gallery_assets, pickerQuery]);

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm());
        setError('');
        setPickerQuery('');
        setModalOpen(true);
    }

    function openEdit(jersey) {
        setEditingId(jersey.id);
        setForm(jerseyToForm(jersey));
        setError('');
        setPickerQuery('');
        setModalOpen(true);
    }

    function toggleMediaAsset(id) {
        const numericId = Number(id);
        setForm((current) => {
            const ids = current.media_asset_ids.map(Number);
            if (ids.includes(numericId)) {
                return { ...current, media_asset_ids: ids.filter((value) => value !== numericId) };
            }

            return { ...current, media_asset_ids: [...ids, numericId] };
        });
    }

    async function saveJersey(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload = buildPayload(form);
            if (editingId) {
                payload.append('_method', 'PUT');
                await adminApi(`/jerseys/${editingId}`, { method: 'POST', body: payload });
            } else {
                await adminApi('/jerseys', { method: 'POST', body: payload });
            }
            setModalOpen(false);
            router.reload({ only: ['jerseys', 'gallery_assets'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteJersey(jersey) {
        if (!confirm(`Delete jersey “${jersey.name}”?`)) {
            return;
        }
        try {
            await adminApi(`/jerseys/${jersey.id}`, { method: 'DELETE' });
            router.reload({ only: ['jerseys'] });
        } catch (err) {
            alert(err.message);
        }
    }

    const columns = [
        { key: 'image', label: '' },
        { key: 'name', label: 'Jersey' },
        { key: 'club', label: 'Club' },
        { key: 'price', label: 'Price' },
        { key: 'stock', label: 'Stock' },
        { key: 'gallery', label: 'Gallery' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: '' },
    ];

    const rows = (jerseys?.data ?? []).map((jersey) => ({
        ...jersey,
        image: jersey.image_url ? (
            <img src={jersey.image_url} alt="" className="h-10 w-10 rounded object-cover" />
        ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-white/5 text-xs text-zinc-500">
                —
            </span>
        ),
        club: jersey.club?.name ?? '—',
        price: `£${jersey.price}`,
        stock: jersey.stock_total,
        gallery: jersey.media_asset_ids?.length ?? 0,
        status: jersey.is_active ? 'Active' : 'Hidden',
        actions: (
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => openEdit(jersey)} className="text-xs text-brand-300">
                    Edit
                </button>
                <button type="button" onClick={() => deleteJersey(jersey)} className="text-xs text-red-400">
                    Delete
                </button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Jerseys">
            <PageHeader
                title="Jerseys"
                description="Marketplace listings with size stock and gallery images."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={adminPath(page.props, 'media')}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200"
                        >
                            Media gallery
                        </a>
                        <button
                            type="button"
                            onClick={openCreate}
                            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                        >
                            Add jersey
                        </button>
                    </div>
                }
            />

            <div className="mb-4 flex flex-wrap gap-3">
                <FormSelect
                    value={filters.club_id ? String(filters.club_id) : ''}
                    onChange={(e) =>
                        router.get(
                            window.location.pathname,
                            e.target.value ? { club_id: e.target.value } : {},
                            { preserveState: true, replace: true },
                        )
                    }
                >
                    <option value="">All clubs</option>
                    {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                            {club.name}
                        </option>
                    ))}
                </FormSelect>
            </div>

            <DataTable columns={columns} rows={rows} />
            <Pagination paginator={jerseys} />

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingId ? 'Edit jersey' : 'Add jersey'}
            >
                <form onSubmit={saveJersey} className="space-y-4">
                    {error ? <p className="text-sm text-red-400">{error}</p> : null}
                    <FormField label="Name">
                        <FormInput
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </FormField>
                    <FormField label="Club">
                        <FormSelect
                            value={form.club_id}
                            onChange={(e) => setForm({ ...form, club_id: e.target.value })}
                        >
                            <option value="">No club</option>
                            {clubs.map((club) => (
                                <option key={club.id} value={club.id}>
                                    {club.name}
                                </option>
                            ))}
                        </FormSelect>
                    </FormField>
                    <FormField label="Price (£)">
                        <FormInput
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            required
                        />
                    </FormField>
                    <FormField label="Description">
                        <FormTextarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                        />
                    </FormField>
                    <label className="flex items-center gap-2 text-sm text-zinc-300">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        />
                        Active listing
                    </label>
                    <FormField label="Cover image (optional fallback)">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setForm({ ...form, imageFile: e.target.files?.[0] ?? null })}
                        />
                    </FormField>

                    <div className="space-y-3 rounded-lg border border-white/10 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-zinc-200">
                                Gallery images ({form.media_asset_ids.length})
                            </p>
                            <FormInput
                                placeholder="Filter gallery…"
                                value={pickerQuery}
                                onChange={(e) => setPickerQuery(e.target.value)}
                            />
                        </div>
                        {gallery_assets.length === 0 ? (
                            <p className="text-xs text-zinc-500">
                                No gallery assets yet. Upload or generate images in Media gallery first.
                            </p>
                        ) : (
                            <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                                {filteredGallery.map((asset) => {
                                    const selected = selectedSet.has(Number(asset.id));

                                    return (
                                        <button
                                            key={asset.id}
                                            type="button"
                                            onClick={() => toggleMediaAsset(asset.id)}
                                            className={`overflow-hidden rounded-lg border text-left transition ${
                                                selected
                                                    ? 'border-brand-400 ring-1 ring-brand-400/50'
                                                    : 'border-white/10 hover:border-white/30'
                                            }`}
                                        >
                                            <img
                                                src={asset.url}
                                                alt=""
                                                className="aspect-[4/5] w-full object-cover"
                                            />
                                            <span className="block truncate px-1.5 py-1 text-[10px] text-zinc-400">
                                                {asset.title || `#${asset.id}`}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 rounded-lg border border-white/10 p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-zinc-200">Sizes</p>
                            <button
                                type="button"
                                className="text-xs text-brand-300"
                                onClick={() =>
                                    setForm({ ...form, variants: [...form.variants, emptyVariant()] })
                                }
                            >
                                Add size
                            </button>
                        </div>
                        {form.variants.map((variant, index) => (
                            <div key={index} className="grid grid-cols-3 gap-2">
                                <FormSelect
                                    value={variant.size}
                                    onChange={(e) => {
                                        const variants = [...form.variants];
                                        variants[index] = { ...variant, size: e.target.value };
                                        setForm({ ...form, variants });
                                    }}
                                >
                                    {SIZES.map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </FormSelect>
                                <FormInput
                                    type="number"
                                    min="0"
                                    value={variant.stock}
                                    onChange={(e) => {
                                        const variants = [...form.variants];
                                        variants[index] = {
                                            ...variant,
                                            stock: Number(e.target.value) || 0,
                                        };
                                        setForm({ ...form, variants });
                                    }}
                                />
                                <FormInput
                                    placeholder="SKU"
                                    value={variant.sku}
                                    onChange={(e) => {
                                        const variants = [...form.variants];
                                        variants[index] = { ...variant, sku: e.target.value };
                                        setForm({ ...form, variants });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
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
