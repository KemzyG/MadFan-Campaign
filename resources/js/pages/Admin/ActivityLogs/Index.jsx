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
            <AdminPageHeader title="Activity logs" description="Audit trail of admin and system events." />
            <AdminFilterBar
                route={adminPath(page.props, 'activity-logs')}
                filters={filters}
                fields={[
                    { name: 'event', label: 'Event', placeholder: 'e.g. user.created' },
                    { name: 'date_from', label: 'From', type: 'date' },
                    { name: 'date_to', label: 'To', type: 'date' },
                ]}
            />
            <AdminTable columns={columns} rows={rows} />
            <AdminPagination links={logs?.links} meta={logs} />
        </AdminLayout>
    );
}
