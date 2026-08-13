import { Head, useForm } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';

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
            <Head title="Checkout — Mad Fan Shop" />

            <div className="mf-shop">
                <div className="mf-tickets-hero mf-tickets-hero--compact">
                    <p className="mf-tickets-kicker mf-text-caption">Confirm order</p>
                    <p className="mf-empty-title mf-tickets-title">Shipping details</p>
                    <p className="mf-tickets-lead">
                        Confirm places the order and reserves stock. Payment provider integration can
                        follow later.
                    </p>
                </div>

                <div className="mf-shop-checkout">
                    <form onSubmit={submit} className="mf-shop-form">
                        {[
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
                        ))}

                        {errors.cart ? <p className="mf-shop-error">{errors.cart}</p> : null}

                        <button type="submit" className="mf-btn mf-btn--pitch" disabled={processing}>
                            {processing ? 'Confirming…' : `Confirm £${cart.total}`}
                        </button>
                    </form>

                    <aside className="mf-shop-summary">
                        <p className="mf-text-caption text-[var(--mf-muted)]">Order summary</p>
                        <ul className="mf-shop-summary__list">
                            {cart.items.map((item) => (
                                <li key={item.variant_id}>
                                    <span>
                                        {item.name} · {item.size} × {item.quantity}
                                    </span>
                                    <span className="mf-mono">£{item.line_total}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mf-mono mf-shop-summary__total">
                            Total <strong>£{cart.total}</strong>
                        </p>
                    </aside>
                </div>
            </div>
        </SocialShell>
    );
}
