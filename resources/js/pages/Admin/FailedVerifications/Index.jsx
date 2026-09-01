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
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { formatDateTime, formatNumber } from '../../../lib/format';
import { adminPath } from '../../../lib/adminPath';

const platformVariant = {
    x: 'brand',
    twitter: 'brand',
    discord: 'default',
    telegram: 'default',
    general: 'warning',
};

export default function FailedVerificationsIndex({
    verifications,
    failed_count: failedCount,
    filters,
    platforms = [],
    tasks = [],
}) {
    const page = usePage();
    const columns = [
        { key: 'user', label: 'User' },
        { key: 'task', label: 'Task' },
        { key: 'platform', label: 'Platform' },
        { key: 'identifier', label: 'Identifier tried' },
        { key: 'reason', label: 'Failure reason' },
        { key: 'failed_at', label: 'Failed at' },
    ];

    const rows = (verifications?.data ?? []).map((row) => ({
        ...row,
        user: (
            <div>
                <div className="font-medium">{row.user?.name ?? '—'}</div>
                <div className="text-xs text-muted-foreground">
                    {row.user?.email}
                    {row.user?.fan_id ? ` · ${row.user.fan_id}` : ''}
                </div>
            </div>
        ),
        task: (
            <div>
                <div className="font-medium">{row.task?.name ?? '—'}</div>
                <div className="text-xs text-muted-foreground">
                    {row.task?.code ?? '—'} · {formatNumber(row.task?.points ?? 0)} pts
                </div>
            </div>
        ),
        platform: (
            <Badge variant={adminBadgeVariant(platformVariant[row.task?.platform] ?? 'default')} className={adminBadgeClass(platformVariant[row.task?.platform] ?? 'default')}>
                {(row.task?.platform ?? 'general').toUpperCase()}
            </Badge>
        ),
        identifier: row.external_handle || row.user?.handle || '—',
        reason: (
            <span className="text-sm text-destructive" title={row.failure_reason ?? ''}>
                {row.failure_reason ?? 'Verification failed'}
            </span>
        ),
        failed_at: formatDateTime(row.failed_at ?? row.updated_at),
    }));

    return (
        <AdminLayout title="Failed verifications">
            <AdminPageHeader
                title="Failed task verifications"
                description="Fans whose social task checks failed. Use this to troubleshoot follow/join issues before they retry."
                actions={
                    failedCount > 0 ? (
                        <Badge variant="destructive">{failedCount} open failure{failedCount === 1 ? '' : 's'}</Badge>
                    ) : null
                }
            />

            <AdminFilterBar
                route={adminPath(page.props, 'failed-verifications')}
                filters={filters}
                fields={[
                    { name: 'search', label: 'Search', placeholder: 'User, task, handle, reason…' },
                    {
                        name: 'platform',
                        label: 'Platform',
                        type: 'select',
                        options: platforms.map((platform) => ({
                            value: platform,
                            label: platform.toUpperCase(),
                        })),
                    },
                    {
                        name: 'task_id',
                        label: 'Task',
                        type: 'select',
                        options: tasks.map((task) => ({
                            value: String(task.id),
                            label: `${task.name} (${task.code})`,
                        })),
                    },
                    { name: 'date_from', label: 'Failed from', type: 'date' },
                    { name: 'date_to', label: 'Failed to', type: 'date' },
                ]}
            />

            <AdminTable columns={columns} rows={rows} emptyMessage="No failed verifications match your filters." />

            <AdminPagination links={verifications?.links} meta={verifications} />

            <p className="mt-6 text-xs text-muted-foreground">
                Tip: users can retry from{' '}
                <Link href="/tasks" className="text-primary hover:underline">
                    fan tasks
                </Link>
                . Confirm they completed the off-platform action (follow, join server, etc.) first.
            </p>
        </AdminLayout>
    );
}
