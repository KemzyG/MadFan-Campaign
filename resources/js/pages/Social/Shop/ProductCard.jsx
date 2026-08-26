import { Link, usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import ShopCrest from './ShopCrest';
import { formatPrice, productTypeChipClass, productTypeLabel } from './productMeta';

function stockChipClass(purchasable) {
    return ['mf-ticket-chip', 'mf-mono', purchasable ? 'mf-ticket-chip--owned' : 'mf-shop-chip--out']
        .filter(Boolean)
        .join(' ');
}

/**
 * A single product tile in the store grid — works for apparel (club crest,
 * sizes), collectibles (rarity mark, no club) and subscriptions (brand mark,
 * plan count) alike, since all three share the same card shape.
 */
export default function ProductCard({ product, index = 0, compact = false }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const optionsPreview = (product.options_available || []).slice(0, compact ? 2 : 4);
    const badgeLabel = product.fandom?.icon
        ? `${product.fandom.icon} ${product.fandom.name}`
        : productTypeLabel(product.product_type);

    return (
        <Link
            href={`/social/shop/${product.slug}`}
            className={['mf-shop-card', compact ? 'mf-shop-card--compact' : ''].filter(Boolean).join(' ')}
            prefetch
            style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
        >
            <div className="mf-shop-card__media">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt=""
                        className="mf-shop-card__img"
                        loading="lazy"
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    <div className="mf-shop-card__placeholder">
                        <ShopCrest club={product.club} fallbackLabel={product.brand} />
                    </div>
                )}
                <div className="mf-shop-card__badges">
                    <span className={`mf-shop-card__kind mf-mono ${productTypeChipClass(product.product_type)}`}>
                        {badgeLabel}
                    </span>
                    {!compact && product.gallery_count > 1 ? (
                        <span className="mf-shop-card__shots mf-mono">{product.gallery_count} shots</span>
                    ) : null}
                </div>
            </div>
            <div className="mf-shop-card__body">
                <div className="mf-shop-card__club">
                    <span className="mf-shop-card__crest" aria-hidden>
                        <ShopCrest club={product.club} fallbackLabel={product.brand} />
                    </span>
                    <p className="mf-text-caption text-[var(--mf-muted)]">
                        {product.club?.name || product.brand || 'Mad Fan'}
                    </p>
                </div>
                <h2 className="mf-shop-card__title mf-display">{product.name}</h2>
                {optionsPreview.length > 0 ? (
                    <p className="mf-shop-card__sizes mf-mono">
                        {optionsPreview.join(' · ')}
                        {(product.options_available || []).length > optionsPreview.length ? ' · …' : ''}
                    </p>
                ) : (
                    <p className="mf-shop-card__sizes mf-mono">No options left</p>
                )}
                <div className="mf-shop-card__meta">
                    <span className="mf-shop-card__price mf-mono">
                        {formatPrice(product.price, product.currency)}
                    </span>
                    <span className={stockChipClass(product.purchasable)}>
                        {product.purchasable ? 'In stock' : 'Sold out'}
                    </span>
                </div>
            </div>
        </Link>
    );
}
