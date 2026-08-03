import { usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import Badge from '../../../Components/Badge';
import DataTable from '../../../Components/DataTable';
import FilterBar from '../../../Components/FilterBar';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
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
            <span className={tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {tx.amount >= 0 ? '+' : ''}
                {formatNumber(tx.amount)}
            </span>
        ),
        source: <Badge variant="brand">{sourceTypeLabels?.[tx.source_type] ?? tx.source_type}</Badge>,
        season: tx.season?.name ?? '—',
        date: formatDateTime(tx.created_at),
    }));

    return (
        <AdminLayout title="Point Transactions">
            <PageHeader title="Point transactions" description="Read-only ledger of all point movements, including penalty shootout." />
            <FilterBar
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
            <DataTable columns={columns} rows={rows} />
            <Pagination links={transactions?.links} meta={transactions} />
        </AdminLayout>
    );
}
