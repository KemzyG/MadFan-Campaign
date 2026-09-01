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
import { usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { formatDateTime, formatNumber } from '../../../lib/format';
import { adminPath } from '../../../lib/adminPath';

export default function PointTransactionsIndex({ transactions, filters, seasons, sourceTypes, sourceTypeLabels }) {
    const page = usePage();
    const columns = [
        { key: 'fan', label: 'Fan' },
        { key: 'amount', label: 'Amount' },
        { key: 'source', label: 'Source' },
        { key: 'season', label: 'Season' },
        { key: 'date', label: 'Date' },
    ];

    const rows = (transactions?.data ?? []).map((tx) => ({
        ...tx,
        fan: tx.user?.name ?? '—',
        amount: (
            <span className={tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
                {tx.amount >= 0 ? '+' : ''}
                {formatNumber(tx.amount)}
            </span>
        ),
        source: <Badge>{sourceTypeLabels?.[tx.source_type] ?? tx.source_type}</Badge>,
        season: tx.season?.name ?? '—',
        date: formatDateTime(tx.created_at),
    }));

    return (
        <AdminLayout title="Point Transactions">
            <AdminPageHeader title="Point transactions" description="Read-only ledger of all point movements, including penalty shootout." />
            <AdminFilterBar
                route={adminPath(page.props, 'point-transactions')}
                filters={filters}
                fields={[
                    {
                        name: 'source_type',
                        label: 'Source',
                        type: 'select',
                        options: sourceTypes?.map((s) => ({
                            value: s,
                            label: sourceTypeLabels?.[s] ?? s,
                        })),
                    },
                    {
                        name: 'season_id',
                        label: 'Season',
                        type: 'select',
                        options: seasons?.map((s) => ({ value: s.id, label: s.name })),
                    },
                    { name: 'date_from', label: 'From', type: 'date' },
                    { name: 'date_to', label: 'To', type: 'date' },
                ]}
            />
            <AdminTable columns={columns} rows={rows} />
            <AdminPagination links={transactions?.links} meta={transactions} />
        </AdminLayout>
    );
}
