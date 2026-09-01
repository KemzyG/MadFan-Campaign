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
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(tier)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => deleteTier(tier)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Loyalty Tiers">
            <AdminPageHeader
                title="Loyalty tiers"
                description="Fan progression levels based on lifetime points."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New tier
                    </Button>
                }
            />
            <AdminTable columns={columns} rows={rows} />

            <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editingId ? 'Edit loyalty tier' : 'Create loyalty tier'}</DialogTitle></DialogHeader>
                <form onSubmit={saveTier} className="space-y-3">
                    <Field ><FieldLabel>Code</FieldLabel>
                        <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Name</FieldLabel>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Min points</FieldLabel>
                        <Input
                            type="number"
                            value={form.min_points}
                            onChange={(e) => setForm({ ...form, min_points: Number(e.target.value) })}
                            required
                        />
                    </Field>
                    <Field  hint="Leave blank for unlimited."><FieldLabel>Max points</FieldLabel>
                        <Input
                            type="number"
                            value={form.max_points}
                            onChange={(e) => setForm({ ...form, max_points: e.target.value })}
                        />
                    </Field>
                    <Field ><FieldLabel>Display order</FieldLabel>
                        <Input
                            type="number"
                            min={0}
                            value={form.display_order}
                            onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                        />
                    </Field>
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
