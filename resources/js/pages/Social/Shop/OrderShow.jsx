import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';

export default function OrderShow({ order }) {
    return (
        <SocialShell title="Order" backHref="/social/shop/orders">
            <Head title={`Order ${order.code} — Mad Fan Store`} />

            <div className="mf-shop">
                <div className="mf-tickets-hero mf-tickets-hero--compact">
                    <p className="mf-tickets-kicker mf-text-caption">Order {order.code}</p>
                    <p className="mf-empty-title mf-tickets-title">{order.status_label}</p>
                    <p className="mf-mono mf-shop-detail__price">£{order.total}</p>
                </div>

                <section className="mf-shop-summary">
                    <p className="mf-text-caption text-[var(--mf-muted)]">Items</p>
                    <ul className="mf-shop-summary__list">
                        {order.items.map((item) => (
                            <li key={item.id}>
                                <span>
                                    {item.name} · {item.size} × {item.quantity}
                                </span>
                                <span className="mf-mono">£{item.line_total}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="mf-shop-summary">
                    <p className="mf-text-caption text-[var(--mf-muted)]">Ship to</p>
                    <p>
                        {order.shipping.name}
                        <br />
                        {order.shipping.line1}
                        {order.shipping.line2 ? (
                            <>
                                <br />
                                {order.shipping.line2}
                            </>
                        ) : null}
                        <br />
                        {order.shipping.city} {order.shipping.postcode}
                        <br />
                        {order.shipping.country}
                    </p>
                </section>

                <Link href="/social/shop" className="mf-btn mf-btn--ghost" prefetch>
                    Back to shop
                </Link>
            </div>
        </SocialShell>
    );
}
