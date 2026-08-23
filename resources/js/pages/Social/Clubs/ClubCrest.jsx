import { usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';

/**
 * Club crest with a monogram fallback. `size` maps to a CSS modifier so the
 * same mark reads correctly in the compact table and the larger detail card.
 */
export default function ClubCrest({ club, size = 'md' }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const cls = `mf-club-crest mf-club-crest--${size}`;

    if (club?.logo_url) {
        return (
            <span className={cls}>
                <img
                    src={club.logo_url}
                    alt=""
                    className="mf-club-crest__img"
                    onError={(event) => onImageError(event, fallbackUrl)}
                />
            </span>
        );
    }

    return (
        <span className={cls}>
            <span className="mf-club-crest__mark mf-display" aria-hidden>
                {(club?.short || club?.name || '?').slice(0, 3)}
            </span>
        </span>
    );
}
