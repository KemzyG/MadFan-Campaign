import { usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';

/**
 * Club crest used across the store — cards, placeholders and the browse chips.
 * Keeps the shop's own .mf-shop-crest__* classes (distinct sizing from the
 * shared .mf-crest badge).
 */
export default function ShopCrest({ club, className = '' }) {
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
            {(club?.short || club?.name || 'MF').slice(0, 3)}
        </span>
    );
}
