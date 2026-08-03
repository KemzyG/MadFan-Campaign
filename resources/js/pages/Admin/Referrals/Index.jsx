import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import Badge from '../../../Components/Badge';
import DataTable from '../../../Components/DataTable';
import FilterBar from '../../../Components/FilterBar';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
import { adminApi } from '../../../lib/api';
import { adminPath } from '../../../lib/adminPath';
import { formatDateTime } from '../../../lib/format';

const statusVariant = {
    pending: 'warning',
    active: 'brand',
    rewarded: 'success',
    rejected: 'danger',
};

export default function ReferralsIndex({ referrals, filters, statuses }) {
    const page = usePage();

    async function updateStatus(referral, status) {
        await adminApi(`/referrals/${referral.id}/status`, {
            method: 'PATCH',
            body: { status },
        });
        router.reload({ only: ['referrals'] });
    }

    const columns = [
        { key: 'code', label: 'Code' },
        { key: 'referrer', label: 'Referrer' },
        { key: 'referred', label: 'Referred' },
        { key: 'status', label: 'Status' },
        { key: 'created', label: 'Created' },
        { key: 'actions', label: '' },
    ];

    const rows = (referrals?.data ?? []).map((ref) => ({
        ...ref,
        code: ref.referral_code,
        referrer: ref.referrer?.name ?? '—',
        referred: ref.referred?.name ?? ref.referred_email ?? '—',
        status: <Badge variant={statusVariant[ref.status]}>{ref.status}</Badge>,
        created: formatDateTime(ref.created_at),
        actions: ref.status === 'pending' && (
            <div className="flex gap-2">
                <button onClick={() => updateStatus(ref, 'active')} className="text-xs text-emerald-400">Activate</button>
                <button onClick={() => updateStatus(ref, 'rejected')} className="text-xs text-red-400">Reject</button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Referrals">
            <PageHeader title="Referrals" description="Track fan referral codes and reward status." />
            <FilterBar
                route={adminPath(page.props, 'referrals')}
                filters={filters}
                fields={[
                    { name: 'search', label: 'Code', placeholder: 'Referral code…' },
                    {
                        name: 'status',
                        label: 'Status',
                        type: 'select',
                        options: statuses?.map((s) => ({ value: s, label: s })),
                    },
                ]}
            />
            <DataTable columns={columns} rows={rows} />
            <Pagination links={referrals?.links} meta={referrals} />
        </AdminLayout>
    );
}
