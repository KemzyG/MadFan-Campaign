import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';

export default function Show({ jersey, cart_count = 0 }) {
    const inStockVariants = useMemo(
        () => (jersey.variants || []).filter((variant) => variant.in_stock),
        [jersey.variants],
    );
    const images = useMemo(() => {
        if (jersey.images?.length) {
            return jersey.images;
        }

        return jersey.image_url
            ? [{ id: 'primary', url: jersey.image_url, alt: jersey.name, title: jersey.name }]
            : [];
    }, [jersey]);

    const [activeImage, setActiveImage] = useState(0);
    const [sizeId, setSizeId] = useState(inStockVariants[0]?.id ?? jersey.variants?.[0]?.id ?? '');
    const { data, setData, post, processing, errors } = useForm({
        variant_id: sizeId,
        quantity: 1,
    });
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const current = images[activeImage] ?? null;

    function selectSize(id) {
        setSizeId(id);
        setData('variant_id', id);
    }

    function addToBag(e) {
        e.preventDefault();
        post('/social/shop/cart');
    }

    return (
        <SocialShell title={jersey.name} backHref="/social/shop">
            <Head title={`${jersey.name} — Mad Fan Shop`} />

            <div className="mf-shop mf-shop--detail">
                <div className="mf-shop-detail">
                    <div className="mf-shop-gallery">
                        <div className="mf-shop-detail__media">
                            {current ? (
                                <img
                                    src={current.url}
                                    alt={current.alt || jersey.name}
                                    className="mf-shop-detail__img"
                                    onError={(event) => onImageError(event, fallbackUrl)}
                                />
                            ) : (
                                <div className="mf-shop-detail__placeholder mf-display">
                                    {(jersey.club?.short || 'MF').slice(0, 3)}
                                </div>
                            )}
                        </div>
                        {images.length > 1 ? (
                            <div className="mf-shop-thumbs" role="list">
                                {images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        type="button"
                                        role="listitem"
                                        className={[
                                            'mf-shop-thumb',
                                            index === activeImage ? 'is-active' : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        onClick={() => setActiveImage(index)}
                                        aria-label={`View image ${index + 1}`}
                                    >
                                        <img
                                            src={image.url}
                                            alt=""
                                            onError={(event) => onImageError(event, fallbackUrl)}
                                        />
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="mf-shop-detail__info">
                        <p className="mf-tickets-kicker mf-text-caption">
                            {jersey.club?.name || 'Mad Fan kit'}
                        </p>
                        <h1 className="mf-empty-title">{jersey.name}</h1>
                        <p className="mf-mono mf-shop-detail__price">£{jersey.price}</p>
                        {jersey.description ? (
                            <p className="mf-tickets-lead">{jersey.description}</p>
                        ) : null}

                        <form onSubmit={addToBag} className="mf-shop-buy">
                            <p className="mf-text-caption text-[var(--mf-muted)]">Size</p>
                            <div className="mf-shop-sizes">
                                {(jersey.variants || []).map((variant) => (
                                    <button
                                        key={variant.id}
                                        type="button"
                                        className={[
                                            'mf-shop-size',
                                            String(sizeId) === String(variant.id) ? 'is-active' : '',
                                            !variant.in_stock ? 'is-disabled' : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        disabled={!variant.in_stock}
                                        onClick={() => selectSize(variant.id)}
                                    >
                                        {variant.size}
                                    </button>
                                ))}
                            </div>

                            <label className="mf-shop-qty">
                                <span className="mf-text-caption text-[var(--mf-muted)]">Qty</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', Number(e.target.value) || 1)}
                                    className="mf-shop-qty__input mf-mono"
                                />
                            </label>

                            {errors.variant_id || errors.quantity || errors.variant ? (
                                <p className="mf-shop-error">
                                    {errors.variant_id || errors.quantity || errors.variant}
                                </p>
                            ) : null}

                            <div className="mf-shop-buy__actions">
                                <button
                                    type="submit"
                                    className="mf-btn mf-btn--pitch"
                                    disabled={processing || !jersey.purchasable || !sizeId}
                                >
                                    {processing ? 'Adding…' : 'Add to bag'}
                                </button>
                                <Link href="/social/shop/cart" className="mf-btn mf-btn--ghost" prefetch>
                                    Bag
                                    {cart_count > 0 ? ` (${cart_count})` : ''}
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </SocialShell>
    );
}
