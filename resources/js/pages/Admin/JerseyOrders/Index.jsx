import { adminBadgeClass, adminBadgeVariant } from '@/lib/admin-badge';
import { AdminFilterBar } from '@/lib/admin-filter-bar';
import { AdminPageHeader } from '@/lib/admin-page-header';
import { AdminPagination } from '@/lib/admin-pagination';
import { AdminTable } from '@/lib/admin-table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { adminApi } from '../../../lib/api';

export default function JerseyOrdersIndex({
    orders,
    statuses = [],
    filters = {},
    canManage = false,
}) {
    const [updatingId, setUpdatingId] = useState(null);

    async function updateStatus(order, status) {
        if (!canManage) {
            return;
        }
        setUpdatingId(order.id);
        try {
            await adminApi(`/jersey-orders/${order.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            });
            router.reload({ only: ['orders'] });
        } catch (err) {
            alert(err.message);
        } finally {
            setUpdatingId(null);
        }
    }

    const columns = [
        { key: 'code', label: 'Code' },
        { key: 'fan', label: 'Fan' },
        { key: 'total', label: 'Total' },
        { key: 'items', label: 'Items' },
        { key: 'status', label: 'Status' },
    ];

    const rows = (orders?.data ?? []).map((order) => ({
        ...order,
        fan: order.user?.email ?? order.shipping_name,
        total: `£${order.total}`,
        items: (order.items || []).map((item) => `${item.name} ${item.size}×${item.quantity}`).join(', '),
        status: canManage ? (
            <NativeSelect className="w-full"
                value={order.status}
                disabled={updatingId === order.id}
                onChange={(e) => updateStatus(order, e.target.value)}
            >
                {statuses.map((status) => (
                    <NativeSelectOption key={status.value} value={status.value}>
                        {status.label}
                    </NativeSelectOption>
                ))}
            </NativeSelect>
        ) : (
            order.status
        ),
    }));

    return (
        <AdminLayout title="Jersey orders">
            <AdminPageHeader
                title="Jersey orders"
                description="Confirmed marketplace orders and fulfillment status."
            />

            <div className="mb-4 flex flex-wrap gap-3">
                <NativeSelect className="w-full"
                    value={filters.status ?? ''}
                    onChange={(e) =>
                        router.get(
                            window.location.pathname,
                            e.target.value ? { status: e.target.value, q: filters.q || undefined } : {},
                            { preserveState: true, replace: true },
                        )
                    }
                >
                    <NativeSelectOption value="">All statuses</NativeSelectOption>
                    {statuses.map((status) => (
                        <NativeSelectOption key={status.value} value={status.value}>
                            {status.label}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </div>

            <AdminTable columns={columns} rows={rows} />
            <AdminPagination links={orders?.links} meta={orders} />
        </AdminLayout>
    );
}
