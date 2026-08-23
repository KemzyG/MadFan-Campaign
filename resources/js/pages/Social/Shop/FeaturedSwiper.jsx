import { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import ShopCrest from './ShopCrest';

function FeaturedCard({ jersey }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    return (
        <Link href={`/social/shop/${jersey.slug}`} className="mf-shop-featured-card" prefetch>
            <div className="mf-shop-featured-card__media">
                {jersey.image_url ? (
                    <img
                        src={jersey.image_url}
                        alt=""
                        className="mf-shop-featured-card__img"
                        loading="lazy"
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    <div className="mf-shop-featured-card__placeholder">
                        <ShopCrest club={jersey.club} />
                    </div>
                )}
                {jersey.kit_kind ? (
                    <span className="mf-shop-featured-card__kind mf-mono">{jersey.kit_kind}</span>
                ) : null}
            </div>
            <div className="mf-shop-featured-card__body">
                <p className="mf-text-caption text-[var(--mf-muted)]">
                    {jersey.club?.name || 'Mad Fan kit'}
                </p>
                <p className="mf-shop-featured-card__title mf-display">{jersey.name}</p>
                <p className="mf-shop-featured-card__price mf-mono">£{jersey.price}</p>
            </div>
        </Link>
    );
}

/**
 * Continuously scrolling ribbon of featured kits (CSS marquee via duplicated
 * track). Renders nothing when there are no featured jerseys.
 */
export default function FeaturedSwiper({ jerseys = [] }) {
    const loop = useMemo(() => {
        if (jerseys.length === 0) {
            return [];
        }

        const base = jerseys.length < 4 ? [...jerseys, ...jerseys] : jerseys;

        return [...base, ...base];
    }, [jerseys]);

    if (loop.length === 0) {
        return null;
    }

    return (
        <section className="mf-shop-featured" aria-label="Featured kits">
            <div className="mf-shop-swiper">
                <div className="mf-shop-swiper__track" style={{ '--mf-shop-swiper-count': loop.length }}>
                    {loop.map((jersey, index) => (
                        <FeaturedCard key={`${jersey.id}-${index}`} jersey={jersey} />
                    ))}
                </div>
            </div>
        </section>
    );
}
