import { usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';

/**
 * Club crest used across the store — cards, placeholders and the browse chips.
 * Falls back to a brand/fandom initial mark when there's no club (most
 * boots/caps/collectibles/subscriptions aren't club-branded).
 */
export default function ShopCrest({ club, fallbackLabel, className = '' }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    if (club?.logo_url) {
        return (
            <img
                src={club.logo_url}
                alt=""
                className={['mf-shop-crest__img', className].filter(Boolean).join(' ')}
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }

    return (
        <span
            className={['mf-shop-crest__mark mf-display', className].filter(Boolean).join(' ')}
            aria-hidden
        >
            {(club?.short || club?.name || fallbackLabel || 'MF').slice(0, 3)}
        </span>
    );
}
