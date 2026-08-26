import { Head, useForm } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import { formatPrice, productOptionWord } from './productMeta';

export default function Checkout({ cart, defaults }) {
    const { data, setData, post, processing, errors } = useForm({
        shipping_name: defaults.shipping_name || '',
        shipping_line1: defaults.shipping_line1 || '',
        shipping_line2: defaults.shipping_line2 || '',
        shipping_city: defaults.shipping_city || '',
        shipping_postcode: defaults.shipping_postcode || '',
        shipping_country: defaults.shipping_country || 'GB',
    });

    function submit(e) {
        e.preventDefault();
        post('/social/shop/checkout');
    }

    return (
        <SocialShell title="Checkout" backHref="/social/shop/cart">
            <Head title="Checkout — Mad Fan Store" />

            <div className="mf-shop">
                <div className="mf-shop-checkout">
                    <form onSubmit={submit} className="mf-shop-form">
                        {cart.requires_shipping ? (
                            [
                                ['shipping_name', 'Full name'],
                                ['shipping_line1', 'Address line 1'],
                                ['shipping_line2', 'Address line 2 (optional)'],
                                ['shipping_city', 'City'],
                                ['shipping_postcode', 'Postcode'],
                                ['shipping_country', 'Country (ISO)'],
                            ].map(([key, label]) => (
                                <label key={key} className="mf-shop-field">
                                    <span className="mf-text-caption text-[var(--mf-muted)]">{label}</span>
                                    <input
                                        value={data[key]}
                                        onChange={(e) => setData(key, e.target.value)}
                                        className="mf-shop-field__input"
                                        required={key !== 'shipping_line2'}
                                    />
                                    {errors[key] ? <span className="mf-shop-error">{errors[key]}</span> : null}
                                </label>
                            ))
                        ) : (
                            <div className="mf-shop-checkout__digital-notice" role="status">
                                <p className="mf-empty-title">Nothing to ship</p>
                                <p className="mf-empty-copy">
                                    Every item in your bag is digital — codes and collectibles land in your
                                    account the moment you confirm.
                                </p>
                            </div>
                        )}

                        {errors.cart ? <p className="mf-shop-error">{errors.cart}</p> : null}

                        <button type="submit" className="mf-btn mf-btn--pitch" disabled={processing}>
                            {processing ? 'Confirming…' : `Confirm ${formatPrice(cart.total)}`}
                        </button>
                    </form>

                    <aside className="mf-shop-summary">
                        <p className="mf-text-caption text-[var(--mf-muted)]">Order summary</p>
                        <ul className="mf-shop-summary__list">
                            {cart.items.map((item) => (
                                <li key={item.variant_id}>
                                    <span>
                                        {item.name} · {productOptionWord(item.product_type)} {item.variant_label} ×{' '}
                                        {item.quantity}
                                    </span>
                                    <span className="mf-mono">{formatPrice(item.line_total)}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mf-mono mf-shop-summary__total">
                            Total <strong>{formatPrice(cart.total)}</strong>
                        </p>
                    </aside>
                </div>
            </div>
        </SocialShell>
    );
}
