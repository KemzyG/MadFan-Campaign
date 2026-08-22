import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';

export default function Orders({ orders = [], cart_count = 0 }) {
    return (
        <SocialShell title="Orders" backHref="/social/shop">
            <Head title="My jersey orders — Mad Fan Store" />

            <div className="mf-shop">
                <div className="mf-tickets-hero mf-tickets-hero--compact">
                    <p className="mf-tickets-kicker mf-text-caption">Order history</p>
                    <p className="mf-empty-title mf-tickets-title">My orders</p>
                    <Link href="/social/shop/cart" className="mf-tickets-mine-link" prefetch>
                        Bag
                        {cart_count > 0 ? (
                            <span className="mf-mono mf-tickets-count">{cart_count}</span>
                        ) : null}
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <p className="mf-empty-copy">No jersey orders yet.</p>
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
                                <p className="mf-mono">£{order.total}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </SocialShell>
    );
}
