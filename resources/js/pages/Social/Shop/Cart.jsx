import { Head, Link, router, useForm } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';

function CartLine({ item }) {
    const { data, setData, put, processing, delete: destroy } = useForm({
        quantity: item.quantity,
    });

    function updateQty(e) {
        e.preventDefault();
        put(`/social/shop/cart/${item.variant_id}`);
    }

    return (
        <article className="mf-shop-line">
            <div>
                <Link href={`/social/shop/${item.slug}`} className="mf-shop-line__name" prefetch>
                    {item.name}
                </Link>
                <p className="mf-text-meta text-[var(--mf-muted)]">
                    Size {item.size}
                    {item.club?.name ? ` · ${item.club.name}` : ''}
                </p>
            </div>
            <form onSubmit={updateQty} className="mf-shop-line__qty">
                <input
                    type="number"
                    min="0"
                    max="10"
                    value={data.quantity}
                    onChange={(e) => setData('quantity', Number(e.target.value))}
                    className="mf-shop-qty__input mf-mono"
                />
                <button type="submit" className="mf-btn mf-btn--ghost" disabled={processing}>
                    Update
                </button>
            </form>
            <p className="mf-mono mf-shop-line__total">£{item.line_total}</p>
            <button
                type="button"
                className="mf-shop-line__remove"
                onClick={() => destroy(`/social/shop/cart/${item.variant_id}`)}
            >
                Remove
            </button>
        </article>
    );
}

export default function Cart({ cart }) {
    const empty = !cart?.items?.length;

    return (
        <SocialShell title="Bag" backHref="/social/shop">
            <Head title="Bag — Mad Fan Shop" />

            <div className="mf-shop">
                <div className="mf-tickets-hero mf-tickets-hero--compact">
                    <p className="mf-tickets-kicker mf-text-caption">Checkout prep</p>
                    <p className="mf-empty-title mf-tickets-title">Your bag</p>
                </div>

                {empty ? (
                    <div className="mf-shop-empty">
                        <p className="mf-empty-copy">Bag is empty.</p>
                        <Link href="/social/shop" className="mf-btn mf-btn--pitch" prefetch>
                            Browse jerseys
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mf-shop-lines">
                            {cart.items.map((item) => (
                                <CartLine key={item.variant_id} item={item} />
                            ))}
                        </div>
                        <div className="mf-shop-summary">
                            <p className="mf-mono">
                                Total <strong>£{cart.total}</strong>
                            </p>
                            <button
                                type="button"
                                className="mf-btn mf-btn--pitch"
                                onClick={() => router.visit('/social/shop/checkout')}
                            >
                                Continue to shipping
                            </button>
                        </div>
                    </>
                )}
            </div>
        </SocialShell>
    );
}
