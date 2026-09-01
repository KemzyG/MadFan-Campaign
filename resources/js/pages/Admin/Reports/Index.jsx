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
import { formatDateTime } from '../../../lib/format';

export default function ReportsIndex({ reports, filters = {}, statuses = [] }) {
    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ status: 'open', notes: '', assigned_to: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function openEdit(item) {
        setEditing(item);
        setForm({
            status: item.status,
            notes: item.notes ?? '',
            assigned_to: item.assigned_to ? String(item.assigned_to) : String(auth?.user?.id ?? ''),
        });
        setError('');
        setOpen(true);
    }

    async function save(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await adminApi(`/reports/${editing.id}`, {
                method: 'PUT',
                body: {
                    status: form.status,
                    notes: form.notes || null,
                    assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
                },
            });
            setOpen(false);
            router.reload({ only: ['reports'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function remove(item) {
        if (!confirm('Delete this report?')) return;
        await adminApi(`/reports/${item.id}`, { method: 'DELETE' });
        router.reload({ only: ['reports'] });
    }

    const rows = (reports?.data ?? []).map((item) => ({
        ...item,
        reporter: item.reporter?.name ?? '—',
        assignee: item.assignee?.name ?? '—',
        target: `${item.target_type} #${item.target_id}`,
        statusBadge: <Badge variant="secondary">{item.status}</Badge>,
        when: formatDateTime(item.created_at),
        actions: (
            <div className="flex justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(item)}>
                    Review
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => remove(item)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Reports">
            <AdminPageHeader title="Moderation reports" description="Review user reports against posts, users, and other social targets." />
            <div className="mb-4">
                <NativeSelect className="w-full"
                    value={filters.status ?? ''}
                    onChange={(e) =>
                        router.get(window.location.pathname, { status: e.target.value || undefined }, { preserveState: true, replace: true })
                    }
                >
                    <NativeSelectOption value="">All statuses</NativeSelectOption>
                    {statuses.map((status) => (
                        <NativeSelectOption key={status} value={status}>
                            {status}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </div>
            <AdminTable
                columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'target', label: 'Target' },
                    { key: 'reason', label: 'Reason' },
                    { key: 'reporter', label: 'Reporter' },
                    { key: 'assignee', label: 'Assignee' },
                    { key: 'statusBadge', label: 'Status' },
                    { key: 'when', label: 'Filed' },
                    { key: 'actions', label: '' },
                ]}
                rows={rows}
            />
            <AdminPagination links={reports?.links} meta={reports} />
            <Dialog
                open={open && !!editing}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (!next) {
                        setEditing(null);
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? `Review report #${editing.id}` : 'Review report'}</DialogTitle>
                    </DialogHeader>
                {editing && (
                    <form onSubmit={save} className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {editing.target_type} #{editing.target_id} · {editing.reason}
                        </p>
                        <Field ><FieldLabel>Status</FieldLabel>
                            <NativeSelect className="w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                {statuses.map((status) => (
                                    <NativeSelectOption key={status} value={status}>
                                        {status}
                                    </NativeSelectOption>
                                ))}
                            </NativeSelect>
                        </Field>
                        <Field ><FieldLabel>Notes</FieldLabel>
                            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
                        </Field>
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
                )}
            </DialogContent></Dialog>
        </AdminLayout>
    );
}
