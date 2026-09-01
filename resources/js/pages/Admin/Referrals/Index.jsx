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
import { Button } from '@/Components/ui/button';
import AdminLayout from '../../../Layouts/AdminLayout';
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
        status: <Badge variant={adminBadgeVariant(statusVariant[ref.status])} className={adminBadgeClass(statusVariant[ref.status])}>{ref.status}</Badge>,
        created: formatDateTime(ref.created_at),
        actions: ref.status === 'pending' && (
            <div className="flex gap-2">
                <Button variant="link" size="sm" type="button" className="text-emerald-600 dark:text-emerald-400" onClick={() => updateStatus(ref, 'active')}>
                    Activate
                </Button>
                <Button variant="link" size="sm" type="button" className="text-destructive" onClick={() => updateStatus(ref, 'rejected')}>
                    Reject
                </Button>
            </div>
        ),
    }));

    return (
        <AdminLayout title="Referrals">
            <AdminPageHeader title="Referrals" description="Track fan referral codes and reward status." />
            <AdminFilterBar
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
            <AdminTable columns={columns} rows={rows} />
            <AdminPagination links={referrals?.links} meta={referrals} />
        </AdminLayout>
    );
}
