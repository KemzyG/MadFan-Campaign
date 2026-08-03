import { usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import DataTable from '../../../Components/DataTable';
import FilterBar from '../../../Components/FilterBar';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
import { formatDateTime } from '../../../lib/format';
import { adminPath } from '../../../lib/adminPath';

export default function ActivityLogsIndex({ logs, filters }) {
    const page = usePage();
    const columns = [
        { key: 'event', label: 'Event' },
        { key: 'description', label: 'Description' },
        { key: 'user', label: 'Actor' },
        { key: 'date', label: 'When' },
    ];

    const rows = (logs?.data ?? []).map((log) => ({
        ...log,
        user: log.user?.name ?? 'System',
        date: formatDateTime(log.created_at),
    }));

    return (
        <AdminLayout title="Activity Logs">
            <PageHeader title="Activity logs" description="Audit trail of admin and system events." />
            <FilterBar
                route={adminPath(page.props, 'activity-logs')}
                filters={filters}
                fields={[
                    { name: 'event', label: 'Event', placeholder: 'e.g. user.created' },
                    { name: 'date_from', label: 'From', type: 'date' },
                    { name: 'date_to', label: 'To', type: 'date' },
                ]}
            />
            <DataTable columns={columns} rows={rows} />
            <Pagination links={logs?.links} meta={logs} />
        </AdminLayout>
    );
}
