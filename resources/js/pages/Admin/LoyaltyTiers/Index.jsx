import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '../../../Components/Admin/Modal';
import { FormField, FormInput } from '../../../Components/Admin/FormField';
import AdminLayout from '../../../Layouts/AdminLayout';
import DataTable from '../../../Components/DataTable';
import PageHeader from '../../../Components/PageHeader';
import { adminApi } from '../../../lib/api';
import { formatNumber } from '../../../lib/format';

const emptyForm = () => ({
    code: '',
    name: '',
    min_points: 0,
    max_points: '',
    display_order: 0,
});

function tierToForm(tier) {
    return {
        code: tier.code ?? '',
        name: tier.name ?? '',
        min_points: tier.min_points ?? 0,
        max_points: tier.max_points ?? '',
        display_order: tier.display_order ?? 0,
    };
}

export default function LoyaltyTiersIndex({ tiers }) {
    usePage();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm());
        setError('');
        setModalOpen(true);
    }

    function openEdit(tier) {
        setEditingId(tier.id);
        setForm(tierToForm(tier));
        setError('');
        setModalOpen(true);
    }

    async function saveTier(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const body = {
                ...form,
                max_points: form.max_points === '' || form.max_points == null ? null : Number(form.max_points),
                min_points: Number(form.min_points),
                display_order: Number(form.display_order) || 0,
            };
            if (editingId) {
                await adminApi(`/loyalty-tiers/${editingId}`, { method: 'PUT', body });
            } else {
                await adminApi('/loyalty-tiers', { method: 'POST', body });
            }
            setModalOpen(false);
            router.reload({ only: ['tiers'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteTier(tier) {
        if (!confirm(`Delete tier “${tier.name}”?`)) {
            return;
        }
        try {
            await adminApi(`/loyalty-tiers/${tier.id}`, { method: 'DELETE' });
            router.reload({ only: ['tiers'] });
        } catch (err) {
            alert(err.message);
        }
    }

    const columns = [
        { key: 'name', label: 'Tier' },
        { key: 'code', label: 'Code' },
        { key: 'range', label: 'Point range' },
        { key: 'order', label: 'Order' },
        { key: 'users', label: 'Fans' },
        { key: 'rewards', label: 'Rewards' },
        { key: 'actions', label: '' },
    ];

    const rows = (tiers ?? []).map((tier) => ({
        ...tier,
        range: `${formatNumber(tier.min_points)} – ${tier.max_points ? formatNumber(tier.max_points) : '∞'}`,
        order: tier.display_order ?? 0,
        users: tier.users_count ?? 0,
        rewards: tier.tier_rewards?.length ?? 0,
        actions: (
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => openEdit(tier)} className="text-xs text-brand-300">
                    Edit
                </button>
                <button type="button" onClick={() => deleteTier(tier)} className="text-xs text-red-400">
                    Delete
                </button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Loyalty Tiers">
            <PageHeader
                title="Loyalty tiers"
                description="Fan progression levels based on lifetime points."
                actions={
                    <button
                        type="button"
                        onClick={openCreate}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900"
                    >
                        New tier
                    </button>
                }
            />
            <DataTable columns={columns} rows={rows} />

            {modalOpen && (
                <Modal title={editingId ? 'Edit loyalty tier' : 'Create loyalty tier'} onClose={() => setModalOpen(false)}>
                    <form onSubmit={saveTier} className="space-y-3">
                        <FormField label="Code">
                            <FormInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                        </FormField>
                        <FormField label="Name">
                            <FormInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </FormField>
                        <FormField label="Min points">
                            <FormInput
                                type="number"
                                value={form.min_points}
                                onChange={(e) => setForm({ ...form, min_points: Number(e.target.value) })}
                                required
                            />
                        </FormField>
                        <FormField label="Max points" hint="Leave blank for unlimited.">
                            <FormInput
                                type="number"
                                value={form.max_points}
                                onChange={(e) => setForm({ ...form, max_points: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Display order">
                            <FormInput
                                type="number"
                                min={0}
                                value={form.display_order}
                                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                            />
                        </FormField>
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setModalOpen(false)} className="text-sm text-zinc-400">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-surface-900 disabled:opacity-60"
                            >
                                {loading ? 'Saving…' : editingId ? 'Save' : 'Create'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </AdminLayout>
    );
}
