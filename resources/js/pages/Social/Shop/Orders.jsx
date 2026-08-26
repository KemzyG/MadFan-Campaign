import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import { formatPrice } from './productMeta';

export default function Orders({ orders = [] }) {
    return (
        <SocialShell title="Orders" backHref="/social/shop">
            <Head title="My orders — Mad Fan Store" />

            <div className="mf-shop">
                {orders.length === 0 ? (
                    <p className="mf-empty-copy">No orders yet.</p>
                ) : (
                    <div className="mf-shop-orders">
                        {orders.map((order) => (
                            <Link
                                key={order.id}
                                href={`/social/shop/orders/${order.id}`}
                                className="mf-shop-order"
                                prefetch
                            >
                                <div>
                                    <p className="mf-mono">{order.code}</p>
                                    <p className="mf-text-meta text-[var(--mf-muted)]">
                                        {order.status_label} · {order.items.length} item
                                        {order.items.length === 1 ? '' : 's'}
                                    </p>
                                </div>
                                <p className="mf-mono">{formatPrice(order.total)}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </SocialShell>
    );
}
