import { Link, usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import ShopCrest from './ShopCrest';

function stockChipClass(purchasable) {
    return ['mf-ticket-chip', 'mf-mono', purchasable ? 'mf-ticket-chip--owned' : 'mf-shop-chip--out']
        .filter(Boolean)
        .join(' ');
}

/**
 * A single jersey tile in the store grid.
 */
export default function JerseyCard({ jersey, index = 0, compact = false }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const sizesPreview = (jersey.sizes_available || []).slice(0, compact ? 2 : 4);

    return (
        <Link
            href={`/social/shop/${jersey.slug}`}
            className={['mf-shop-card', compact ? 'mf-shop-card--compact' : ''].filter(Boolean).join(' ')}
            prefetch
            style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
        >
            <div className="mf-shop-card__media">
                {jersey.image_url ? (
                    <img
                        src={jersey.image_url}
                        alt=""
                        className="mf-shop-card__img"
                        loading="lazy"
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    <div className="mf-shop-card__placeholder">
                        <ShopCrest club={jersey.club} />
                    </div>
                )}
                <div className="mf-shop-card__badges">
                    {jersey.kit_kind ? (
                        <span className="mf-shop-card__kind mf-mono">{jersey.kit_kind}</span>
                    ) : null}
                    {!compact && jersey.gallery_count > 1 ? (
                        <span className="mf-shop-card__shots mf-mono">{jersey.gallery_count} shots</span>
                    ) : null}
                </div>
            </div>
            <div className="mf-shop-card__body">
                <div className="mf-shop-card__club">
                    <span className="mf-shop-card__crest" aria-hidden>
                        <ShopCrest club={jersey.club} />
                    </span>
                    <p className="mf-text-caption text-[var(--mf-muted)]">
                        {jersey.club?.name || 'Mad Fan kit'}
                    </p>
                </div>
                <h2 className="mf-shop-card__title mf-display">{jersey.name}</h2>
                {sizesPreview.length > 0 ? (
                    <p className="mf-shop-card__sizes mf-mono">
                        {sizesPreview.join(' · ')}
                        {(jersey.sizes_available || []).length > sizesPreview.length ? ' · …' : ''}
                    </p>
                ) : (
                    <p className="mf-shop-card__sizes mf-mono">No sizes left</p>
                )}
                <div className="mf-shop-card__meta">
                    <span className="mf-shop-card__price mf-mono">£{jersey.price}</span>
                    <span className={stockChipClass(jersey.purchasable)}>
                        {jersey.purchasable ? 'In stock' : 'Sold out'}
                    </span>
                </div>
            </div>
        </Link>
    );
}
