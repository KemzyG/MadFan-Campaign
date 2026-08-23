import { usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';

/**
 * Shared club crest with a monogram fallback, used across the Social content
 * pages (fixtures, tickets, store, profile). Styles live in social/split.css
 * under .mf-crest.
 */
export default function Crest({ club, size = 'md', className = '' }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const cls = ['mf-crest', `mf-crest--${size}`, className].filter(Boolean).join(' ');

    if (club?.logo_url) {
        return (
            <span className={cls}>
                <img
                    src={club.logo_url}
                    alt=""
                    className="mf-crest__img"
                    onError={(event) => onImageError(event, fallbackUrl)}
                />
            </span>
        );
    }

    return (
        <span className={cls}>
            <span className="mf-crest__mark mf-display" aria-hidden>
                {(club?.short || club?.name || '?').slice(0, 3)}
            </span>
        </span>
    );
}
