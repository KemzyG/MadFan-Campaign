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
import { useMemo, useState } from 'react';
import { Button } from '@/Components/ui/button';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';
import { formatNumber } from '../../../lib/format';

function emptyForm(seasons) {
    return {
        season_id: seasons?.[0]?.id ?? '',
        code: '',
        name: '',
        description: '',
        points: 10,
        platform: 'internal',
        task_type: 'general',
        audience: 'fan',
        staff_position: '',
        assigned_user_id: '',
        external_url: '',
        verification_required: false,
        is_active: true,
        display_order: 0,
        starts_at: '',
        ends_at: '',
        steps: [],
    };
}

function taskToForm(task) {
    return {
        season_id: task.season_id ?? task.season?.id ?? '',
        code: task.code ?? '',
        name: task.name ?? '',
        description: task.description ?? '',
        points: task.points ?? 10,
        platform: task.platform ?? 'internal',
        task_type: task.task_type ?? 'general',
        audience: task.audience ?? 'fan',
        staff_position: task.staff_position ?? '',
        assigned_user_id: task.assigned_user_id ?? '',
        external_url: task.external_url ?? '',
        verification_required: Boolean(task.verification_required),
        is_active: Boolean(task.is_active),
        display_order: task.display_order ?? 0,
        starts_at: task.starts_at ? String(task.starts_at).slice(0, 16) : '',
        ends_at: task.ends_at ? String(task.ends_at).slice(0, 16) : '',
        steps: (task.task_steps ?? task.taskSteps ?? []).map((step) => ({
            description: step.description ?? '',
            link_url: step.link_url ?? '',
            link_label: step.link_label ?? '',
        })),
    };
}

function buildPayload(form) {
    const isStaffAudience = form.audience === 'staff';

    return {
        ...form,
        season_id: Number(form.season_id),
        points: Number(form.points),
        display_order: Number(form.display_order) || 0,
        staff_position: isStaffAudience && form.staff_position ? form.staff_position : null,
        assigned_user_id: isStaffAudience && form.assigned_user_id ? Number(form.assigned_user_id) : null,
        external_url: form.external_url || null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        verification_required: Boolean(form.verification_required),
        is_active: Boolean(form.is_active),
        steps: (form.steps ?? [])
            .filter((step) => step.description?.trim())
            .map((step) => ({
                description: step.description,
                link_url: step.link_url || null,
                link_label: step.link_label || null,
            })),
    };
}

export default function TasksIndex({
    tasks,
    filters,
    seasons,
    platforms = [],
    taskTypes = [],
    staffPositions = [],
    audiences = [],
    staffMembers = [],
    failed_verification_count: failedVerificationCount = 0,
    pending_review_count: pendingReviewCount = 0,
}) {
    const page = usePage();
    const base = adminPath(page.props);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(() => emptyForm(seasons));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isStaffAudience = form.audience === 'staff';
    const isEditing = editingId != null;

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm(seasons));
        setError('');
        setModalOpen(true);
    }

    function openEdit(task) {
        setEditingId(task.id);
        setForm(taskToForm(task));
        setError('');
        setModalOpen(true);
    }

    async function saveTask(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = buildPayload(form);
            if (isEditing) {
                await adminApi(`/tasks/${editingId}`, { method: 'PUT', body: payload });
            } else {
                await adminApi('/tasks', { method: 'POST', body: payload });
            }
            setModalOpen(false);
            setEditingId(null);
            setForm(emptyForm(seasons));
            router.reload({ only: ['tasks', 'pending_review_count', 'failed_verification_count'] });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function toggleActive(task) {
        try {
            await adminApi(`/tasks/${task.id}`, {
                method: 'PUT',
                body: { is_active: !task.is_active },
            });
            router.reload({ only: ['tasks'] });
        } catch (err) {
            alert(err.message);
        }
    }

    async function deleteTask(task) {
        if (!confirm(`Delete task “${task.name}”?`)) {
            return;
        }
        try {
            await adminApi(`/tasks/${task.id}`, { method: 'DELETE' });
            router.reload({ only: ['tasks'] });
        } catch (err) {
            alert(err.message);
        }
    }

    function updateStep(index, patch) {
        setForm((prev) => ({
            ...prev,
            steps: prev.steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
        }));
    }

    function addStep() {
        setForm((prev) => ({
            ...prev,
            steps: [...prev.steps, { description: '', link_url: '', link_label: '' }],
        }));
    }

    function removeStep(index) {
        setForm((prev) => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index),
        }));
    }

    const columns = useMemo(
        () => [
            { key: 'name', label: 'Task' },
            { key: 'code', label: 'Code' },
            { key: 'audience_label', label: 'Audience' },
            { key: 'season', label: 'Season' },
            { key: 'points', label: 'Points' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: '' },
        ],
        [],
    );

    function audienceLabel(task) {
        if (task.audience === 'staff') {
            if (task.assigned_user_id) {
                return 'Staff · Individual';
            }
            if (task.staff_position) {
                return `Staff · ${String(task.staff_position).replace('_', ' ')}`;
            }
            return 'Staff';
        }
        return 'Fan';
    }

    const rows = (tasks?.data ?? []).map((task) => ({
        ...task,
        audience_label: audienceLabel(task),
        season: task.season?.name ?? '—',
        points: formatNumber(task.points),
        status: (
            <Badge variant={adminBadgeVariant(task.is_active ? 'success' : 'default')} className={adminBadgeClass(task.is_active ? 'success' : 'default')}>
                {task.is_active ? 'Active' : 'Inactive'}
            </Badge>
        ),
        actions: (
            <div className="flex flex-wrap justify-end gap-2">
                <Button variant="link" size="sm" type="button" onClick={() => openEdit(task)}>
                    Edit
                </Button>
                <Button variant="link" size="sm" type="button" className="text-muted-foreground" onClick={() => toggleActive(task)}>
                    {task.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => deleteTask(task)}>
                    Delete
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Tasks">
            <AdminPageHeader
                title="Tasks"
                description="Full campaign task CRUD — platforms, verification, steps, and staff assignments."
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {pendingReviewCount > 0 && (
                            <Button variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-300" asChild>
                                <Link href={`${base}/task-reviews`}>
                                    {pendingReviewCount} awaiting review
                                    {pendingReviewCount === 1 ? '' : 's'}
                                </Link>
                            </Button>
                        )}
                        {failedVerificationCount > 0 && (
                            <Button variant="outline" className="text-destructive" asChild>
                                <Link href={`${base}/task-reviews?status=rejected`}>
                                    {failedVerificationCount} rejected
                                </Link>
                            </Button>
                        )}
                        <Button type="button" onClick={openCreate}>
                            New task
                        </Button>
                    </div>
                }
            />

            <AdminFilterBar
                route={`${base}/tasks`}
                filters={filters}
                fields={[
                    { name: 'search', label: 'Search', placeholder: 'Task name…' },
                    {
                        name: 'season_id',
                        label: 'Season',
                        type: 'select',
                        options: seasons?.map((s) => ({ value: s.id, label: s.name })),
                    },
                    {
                        name: 'is_active',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: '1', label: 'Active' },
                            { value: '0', label: 'Inactive' },
                        ],
                    },
                ]}
            />

            <AdminTable columns={columns} rows={rows} />
            <AdminPagination links={tasks?.links} meta={tasks} />

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit task' : 'Create task'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={saveTask} className="space-y-4">
                        {error ? <p className="text-sm text-destructive">{error}</p> : null}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field ><FieldLabel>Season</FieldLabel>
                                <NativeSelect className="w-full"
                                    value={form.season_id}
                                    onChange={(e) => setForm({ ...form, season_id: e.target.value })}
                                    required
                                >
                                    {seasons?.map((s) => (
                                        <NativeSelectOption key={s.id} value={s.id}>
                                            {s.name}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </Field>
                            <Field ><FieldLabel>Audience</FieldLabel>
                                <NativeSelect className="w-full"
                                    value={form.audience}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            audience: e.target.value,
                                            staff_position: '',
                                            assigned_user_id: '',
                                        })
                                    }
                                >
                                    {audiences.map((audience) => (
                                        <NativeSelectOption key={audience.value} value={audience.value}>
                                            {audience.label}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </Field>
                        </div>

                        {isStaffAudience && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field ><FieldLabel>Staff position</FieldLabel>
                                    <NativeSelect className="w-full"
                                        value={form.staff_position}
                                        onChange={(e) => setForm({ ...form, staff_position: e.target.value })}
                                    >
                                        <NativeSelectOption value="">All staff positions</NativeSelectOption>
                                        {staffPositions.map((position) => (
                                            <NativeSelectOption key={position.value} value={position.value}>
                                                {position.label}
                                            </NativeSelectOption>
                                        ))}
                                    </NativeSelect>
                                </Field>
                                <Field ><FieldLabel>Assignee</FieldLabel>
                                    <NativeSelect className="w-full"
                                        value={form.assigned_user_id}
                                        onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}
                                    >
                                        <NativeSelectOption value="">No individual assignee</NativeSelectOption>
                                        {staffMembers.map((member) => (
                                            <NativeSelectOption key={member.id} value={member.id}>
                                                {member.name} ({member.fan_id})
                                            </NativeSelectOption>
                                        ))}
                                    </NativeSelect>
                                </Field>
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field ><FieldLabel>Code</FieldLabel>
                                <Input
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    required
                                />
                            </Field>
                            <Field ><FieldLabel>Points</FieldLabel>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.points}
                                    onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                                    required
                                />
                            </Field>
                        </div>

                        <Field ><FieldLabel>Name</FieldLabel>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </Field>

                        <Field ><FieldLabel>Description</FieldLabel>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <Field ><FieldLabel>Platform</FieldLabel>
                                <NativeSelect className="w-full"
                                    value={form.platform}
                                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                                >
                                    {platforms.map((platform) => (
                                        <NativeSelectOption key={platform} value={platform}>
                                            {platform}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </Field>
                            <Field ><FieldLabel>Type</FieldLabel>
                                <NativeSelect className="w-full"
                                    value={form.task_type}
                                    onChange={(e) => setForm({ ...form, task_type: e.target.value })}
                                >
                                    {taskTypes.map((type) => (
                                        <NativeSelectOption key={type} value={type}>
                                            {type}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </Field>
                            <Field ><FieldLabel>Display order</FieldLabel>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.display_order}
                                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                                />
                            </Field>
                        </div>

                        <Field ><FieldLabel>External URL</FieldLabel>
                            <Input
                                type="url"
                                placeholder="https://"
                                value={form.external_url}
                                onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                            />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field ><FieldLabel>Starts at</FieldLabel>
                                <Input
                                    type="datetime-local"
                                    value={form.starts_at}
                                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                                />
                            </Field>
                            <Field ><FieldLabel>Ends at</FieldLabel>
                                <Input
                                    type="datetime-local"
                                    value={form.ends_at}
                                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                                />
                            </Field>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.verification_required}
                                    onChange={(e) => setForm({ ...form, verification_required: e.target.checked })}
                                />
                                Verification required
                            </label>
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                />
                                Active
                            </label>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-semibold">Steps</h4>
                                <Button type="button" variant="link" size="sm" onClick={addStep}>
                                    + Add step
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {form.steps.length === 0 && (
                                    <p className="text-xs text-muted-foreground">No steps yet.</p>
                                )}
                                {form.steps.map((step, index) => (
                                    <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                                        <Field>
                                            <FieldLabel>{`Step ${index + 1}`}</FieldLabel>
                                            <Input
                                                value={step.description}
                                                onChange={(e) => updateStep(index, { description: e.target.value })}
                                                placeholder="What the fan should do"
                                                required
                                            />
                                        </Field>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <Input
                                                value={step.link_url}
                                                onChange={(e) => updateStep(index, { link_url: e.target.value })}
                                                placeholder="Link URL"
                                            />
                                            <Input
                                                value={step.link_label}
                                                onChange={(e) => updateStep(index, { link_label: e.target.value })}
                                                placeholder="Link label"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => removeStep(index)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving…' : isEditing ? 'Save changes' : 'Create'}
                            </Button>
                        </div>
                    </form>
            </DialogContent></Dialog>
        </AdminLayout>
    );
}
