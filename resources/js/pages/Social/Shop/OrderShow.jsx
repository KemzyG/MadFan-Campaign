import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import { formatPrice, productOptionWord } from './productMeta';

export default function OrderShow({ order }) {
    return (
        <SocialShell title="Order" backHref="/social/shop/orders">
            <Head title={`Order ${order.code} — Mad Fan Store`} />

            <div className="mf-shop">
                <div className="mf-shop-order-meta">
                    <p className="mf-mono">{order.status_label}</p>
                    <p className="mf-mono mf-shop-detail__price">{formatPrice(order.total)}</p>
                </div>

                <section className="mf-shop-summary">
                    <p className="mf-text-caption text-[var(--mf-muted)]">Items</p>
                    <ul className="mf-shop-summary__list">
                        {order.items.map((item) => (
                            <li key={item.id}>
                                <span>
                                    {item.name} · {productOptionWord(item.product_type)} {item.variant_label} ×{' '}
                                    {item.quantity}
                                </span>
                                <span className="mf-mono">{formatPrice(item.line_total)}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {order.shipping ? (
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
                ) : (
                    <section className="mf-shop-summary">
                        <p className="mf-text-caption text-[var(--mf-muted)]">Delivery</p>
                        <p>Digital — codes and collectibles are already in your account.</p>
                    </section>
                )}

                <Link href="/social/shop" className="mf-btn mf-btn--ghost" prefetch>
                    Back to store
                </Link>
            </div>
        </SocialShell>
    );
}
