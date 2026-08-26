import { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import ShopCrest from './ShopCrest';
import { formatPrice } from './productMeta';

function FeaturedCard({ product }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    return (
        <Link href={`/social/shop/${product.slug}`} className="mf-shop-featured-card" prefetch>
            <div className="mf-shop-featured-card__media">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt=""
                        className="mf-shop-featured-card__img"
                        loading="lazy"
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    <div className="mf-shop-featured-card__placeholder">
                        <ShopCrest club={product.club} fallbackLabel={product.brand} />
                    </div>
                )}
            </div>
            <div className="mf-shop-featured-card__body">
                <p className="mf-text-caption text-[var(--mf-muted)]">
                    {product.club?.name || product.brand || 'Mad Fan'}
                </p>
                <p className="mf-shop-featured-card__title mf-display">{product.name}</p>
                <p className="mf-shop-featured-card__price mf-mono">{formatPrice(product.price, product.currency)}</p>
            </div>
        </Link>
    );
}

/**
 * Continuously scrolling ribbon of featured products (CSS marquee via
 * duplicated track). Renders nothing when there's nothing featured.
 */
export default function FeaturedSwiper({ products = [] }) {
    const loop = useMemo(() => {
        if (products.length === 0) {
            return [];
        }

        const base = products.length < 4 ? [...products, ...products] : products;

        return [...base, ...base];
    }, [products]);

    if (loop.length === 0) {
        return null;
    }

    return (
        <section className="mf-shop-featured" aria-label="Featured products">
            <div className="mf-shop-swiper">
                <div className="mf-shop-swiper__track" style={{ '--mf-shop-swiper-count': loop.length }}>
                    {loop.map((product, index) => (
                        <FeaturedCard key={`${product.id}-${index}`} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
