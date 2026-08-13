import { router } from '@inertiajs/react';
import { useState } from 'react';
import { FormSelect } from '../../../Components/Admin/FormField';
import AdminLayout from '../../../Layouts/AdminLayout';
import DataTable from '../../../Components/DataTable';
import PageHeader from '../../../Components/PageHeader';
import Pagination from '../../../Components/Pagination';
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
            <FormSelect
                value={order.status}
                disabled={updatingId === order.id}
                onChange={(e) => updateStatus(order, e.target.value)}
            >
                {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                        {status.label}
                    </option>
                ))}
            </FormSelect>
        ) : (
            order.status
        ),
    }));

    return (
        <AdminLayout title="Jersey orders">
            <PageHeader
                title="Jersey orders"
                description="Confirmed marketplace orders and fulfillment status."
            />

            <div className="mb-4 flex flex-wrap gap-3">
                <FormSelect
                    value={filters.status ?? ''}
                    onChange={(e) =>
                        router.get(
                            window.location.pathname,
                            e.target.value ? { status: e.target.value, q: filters.q || undefined } : {},
                            { preserveState: true, replace: true },
                        )
                    }
                >
                    <option value="">All statuses</option>
                    {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                            {status.label}
                        </option>
                    ))}
                </FormSelect>
            </div>

            <DataTable columns={columns} rows={rows} />
            <Pagination paginator={orders} />
        </AdminLayout>
    );
}
