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
import { formatDate } from '../../../lib/format';

const emptyForm = () => ({
    code: '',
    name: '',
    status: 'draft',
    starts_at: '',
    ends_at: '',
    total_weeks: 4,
});

function seasonToForm(season) {
    return {
        code: season.code ?? '',
        name: season.name ?? '',
        status: season.status ?? 'draft',
        starts_at: season.starts_at ? String(season.starts_at).slice(0, 10) : '',
        ends_at: season.ends_at ? String(season.ends_at).slice(0, 10) : '',
        total_weeks: season.total_weeks ?? 4,
    };
}

export default function SeasonsIndex({ seasons }) {
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

    function openEdit(season) {
        setEditingId(season.id);
        setForm(seasonToForm(season));
        setError('');
        setModalOpen(true);
    }

    async function saveSeason(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (editingId) {
                await adminApi(`/seasons/${editingId}`, { method: 'PUT', body: form });
            } else {
                await adminApi('/seasons', { method: 'POST', body: form });
            }
            setModalOpen(false);
            router.reload({ only: ['seasons'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function deleteSeason(season) {
        if (!confirm(`Delete season “${season.name}”?`)) {
            return;
        }
        try {
            await adminApi(`/seasons/${season.id}`, { method: 'DELETE' });
            router.reload({ only: ['seasons'] });
        } catch (err) {
            alert(err.message);
        }
    }

    const statusVariant = {
        active: 'success',
        draft: 'default',
        completed: 'brand',
        archived: 'warning',
    };

    const columns = [
        { key: 'name', label: 'Season' },
        { key: 'code', label: 'Code' },
        { key: 'status', label: 'Status' },
        { key: 'period', label: 'Period' },
        { key: 'tasks', label: 'Tasks' },
        { key: 'weeks', label: 'Weeks' },
        { key: 'actions', label: '' },
    ];

    const rows = (seasons?.data ?? []).map((season) => ({
        ...season,
        status: <Badge variant={adminBadgeVariant(statusVariant[season.status] ?? 'default')} className={adminBadgeClass(statusVariant[season.status] ?? 'default')}>{season.status}</Badge>,
        period: `${formatDate(season.starts_at)} – ${formatDate(season.ends_at)}`,
        tasks: season.tasks_count ?? 0,
        weeks: season.season_weeks_count ?? 0,
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(season)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => deleteSeason(season)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Seasons">
            <AdminPageHeader
                title="Seasons"
                description="Time-boxed loyalty campaigns and point budgets."
                actions={
                    <Button type="button" onClick={openCreate}>
                        New season
                    </Button>
                }
            />
            <AdminTable columns={columns} rows={rows} />
            <AdminPagination links={seasons?.links} meta={seasons} />

            <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editingId ? 'Edit season' : 'Create season'}</DialogTitle></DialogHeader>
                <form onSubmit={saveSeason} className="space-y-3">
                    <Field ><FieldLabel>Code</FieldLabel>
                        <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Name</FieldLabel>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Status</FieldLabel>
                        <NativeSelect className="w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            {['draft', 'active', 'completed', 'archived'].map((s) => (
                                <NativeSelectOption key={s} value={s}>
                                    {s}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    </Field>
                    <Field ><FieldLabel>Starts</FieldLabel>
                        <Input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Ends</FieldLabel>
                        <Input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} required />
                    </Field>
                    <Field ><FieldLabel>Total weeks</FieldLabel>
                        <Input
                            type="number"
                            min="1"
                            value={form.total_weeks}
                            onChange={(e) => setForm({ ...form, total_weeks: Number(e.target.value) })}
                            required
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
