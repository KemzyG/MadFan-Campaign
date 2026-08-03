import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import Badge from '../../../Components/Badge';
import DataTable from '../../../Components/DataTable';
import FilterBar from '../../../Components/FilterBar';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
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
                <div className="font-medium text-zinc-100">{row.user?.name ?? '—'}</div>
                <div className="text-xs text-zinc-500">
                    {row.user?.email}
                    {row.user?.fan_id ? ` · ${row.user.fan_id}` : ''}
                </div>
            </div>
        ),
        task: (
            <div>
                <div className="font-medium text-zinc-100">{row.task?.name ?? '—'}</div>
                <div className="text-xs text-zinc-500">
                    {row.task?.code ?? '—'} · {formatNumber(row.task?.points ?? 0)} pts
                </div>
            </div>
        ),
        platform: (
            <Badge variant={platformVariant[row.task?.platform] ?? 'default'}>
                {(row.task?.platform ?? 'general').toUpperCase()}
            </Badge>
        ),
        identifier: row.external_handle || row.user?.handle || '—',
        reason: (
            <span className="text-sm text-red-300/90" title={row.failure_reason ?? ''}>
                {row.failure_reason ?? 'Verification failed'}
            </span>
        ),
        failed_at: formatDateTime(row.failed_at ?? row.updated_at),
    }));

    return (
        <AdminLayout title="Failed verifications">
            <PageHeader
                title="Failed task verifications"
                description="Fans whose social task checks failed. Use this to troubleshoot follow/join issues before they retry."
                actions={
                    failedCount > 0 ? (
                        <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300 ring-1 ring-red-500/30">
                            {failedCount} open failure{failedCount === 1 ? '' : 's'}
                        </span>
                    ) : null
                }
            />

            <FilterBar
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

            {rows.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-surface-800/60 p-8 text-center text-sm text-zinc-400">
                    No failed verifications match your filters.
                </div>
            ) : (
                <DataTable columns={columns} rows={rows} />
            )}

            <Pagination links={verifications?.links} meta={verifications} />

            <p className="mt-6 text-xs text-zinc-500">
                Tip: users can retry from{' '}
                <Link href="/tasks" className="text-brand-400 hover:text-brand-300">
                    fan tasks
                </Link>
                . Confirm they completed the off-platform action (follow, join server, etc.) first.
            </p>
        </AdminLayout>
    );
}
