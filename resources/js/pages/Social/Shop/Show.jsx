import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { formatPrice, productOptionWord, productTypeLabel } from './productMeta';

export default function Show({ product, cart_count = 0 }) {
    const inStockVariants = useMemo(
        () => (product.variants || []).filter((variant) => variant.in_stock),
        [product.variants],
    );
    const images = useMemo(() => {
        if (product.images?.length) {
            return product.images;
        }

        return product.image_url
            ? [{ id: 'primary', url: product.image_url, alt: product.name, title: product.name }]
            : [];
    }, [product]);

    const [activeImage, setActiveImage] = useState(0);
    const [variantId, setVariantId] = useState(inStockVariants[0]?.id ?? product.variants?.[0]?.id ?? '');
    const { data, setData, post, processing, errors } = useForm({
        variant_id: variantId,
        quantity: 1,
    });
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const current = images[activeImage] ?? null;
    const selectedVariant = (product.variants || []).find((variant) => String(variant.id) === String(variantId));
    const canBuy = product.purchasable && Boolean(variantId) && selectedVariant?.in_stock;
    const optionWord = productOptionWord(product.product_type);
    const attributeEntries = Object.entries(product.attributes || {});

    function selectVariant(id) {
        setVariantId(id);
        setData('variant_id', id);
    }

    function addToBag(e) {
        e.preventDefault();
        post('/social/shop/cart');
    }

    return (
        <SocialShell title={product.name} backHref="/social/shop">
            <Head title={`${product.name} — Mad Fan Store`} />

            <div className="mf-shop mf-shop--detail">
                <div className="mf-shop-detail">
                    <div className="mf-shop-gallery">
                        <div className="mf-shop-detail__media">
                            {current ? (
                                <img
                                    src={current.url}
                                    alt={current.alt || product.name}
                                    className="mf-shop-detail__img"
                                    onError={(event) => onImageError(event, fallbackUrl)}
                                />
                            ) : (
                                <div className="mf-shop-detail__placeholder mf-display">
                                    {(product.club?.short || product.brand || 'MF').slice(0, 3)}
                                </div>
                            )}
                            <span className="mf-shop-detail__kind mf-mono">{productTypeLabel(product.product_type)}</span>
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
                                        aria-pressed={index === activeImage}
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
                        <div className="mf-shop-detail__price-row">
                            <p className="mf-mono mf-shop-detail__price">
                                {formatPrice(selectedVariant?.price ?? product.price, product.currency)}
                            </p>
                            <span
                                className={[
                                    'mf-ticket-chip',
                                    'mf-mono',
                                    product.purchasable ? 'mf-ticket-chip--owned' : 'mf-shop-chip--out',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            >
                                {product.purchasable ? 'In stock' : 'Sold out'}
                            </span>
                        </div>
                        {product.description ? (
                            <p className="mf-tickets-lead mf-shop-detail__lead">{product.description}</p>
                        ) : null}

                        {attributeEntries.length > 0 ? (
                            <dl className="mf-shop-attributes">
                                {attributeEntries.map(([key, value]) => (
                                    <div key={key} className="mf-shop-attributes__row">
                                        <dt className="mf-text-caption text-[var(--mf-muted)]">
                                            {key.replace(/_/g, ' ')}
                                        </dt>
                                        <dd>{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        ) : null}

                        {!product.purchasable ? (
                            <div className="mf-shop-detail__notice" role="status">
                                <p className="mf-empty-title">Sold out</p>
                                <p className="mf-empty-copy">
                                    Every option on this item is gone. Browse the store for another drop.
                                </p>
                                <Link href="/social/shop" className="mf-btn mf-btn--ghost" prefetch>
                                    Back to store
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={addToBag} className="mf-shop-buy">
                                <div className="mf-shop-buy__label-row">
                                    <p className="mf-text-caption text-[var(--mf-muted)]">{optionWord}</p>
                                    {selectedVariant ? (
                                        <p className="mf-shop-buy__stock mf-mono">
                                            {selectedVariant.in_stock
                                                ? selectedVariant.stock === null
                                                    ? 'Available'
                                                    : `${selectedVariant.stock} left`
                                                : 'Out'}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="mf-shop-sizes" role="group" aria-label={`Select ${optionWord.toLowerCase()}`}>
                                    {(product.variants || []).map((variant) => (
                                        <button
                                            key={variant.id}
                                            type="button"
                                            className={[
                                                'mf-shop-size',
                                                String(variantId) === String(variant.id) ? 'is-active' : '',
                                                !variant.in_stock ? 'is-disabled' : '',
                                            ]
                                                .filter(Boolean)
                                                .join(' ')}
                                            disabled={!variant.in_stock}
                                            onClick={() => selectVariant(variant.id)}
                                            aria-pressed={String(variantId) === String(variant.id)}
                                        >
                                            {variant.label}
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
                                    <p className="mf-shop-error" role="alert">
                                        {errors.variant_id || errors.quantity || errors.variant}
                                    </p>
                                ) : null}

                                <div className="mf-shop-buy__actions">
                                    <button
                                        type="submit"
                                        className="mf-btn mf-btn--pitch"
                                        disabled={processing || !canBuy}
                                    >
                                        {processing ? 'Adding…' : 'Add to bag'}
                                    </button>
                                    <Link href="/social/shop/cart" className="mf-btn mf-btn--ghost" prefetch>
                                        Bag
                                        {cart_count > 0 ? ` (${cart_count})` : ''}
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </SocialShell>
    );
}
