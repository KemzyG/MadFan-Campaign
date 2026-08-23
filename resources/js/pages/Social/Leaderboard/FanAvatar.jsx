import { usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';

/**
 * Fan avatar with graceful fallbacks: uploaded image → emoji → handle initial.
 */
export default function FanAvatar({ fan, size = 'md' }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const sizeClass = `mf-lb-avatar--${size}`;

    if (fan?.avatar_url) {
        return (
            <span className={`mf-lb-avatar ${sizeClass}`}>
                <img
                    src={fan.avatar_url}
                    alt=""
                    className="mf-lb-avatar__img"
                    onError={(event) => onImageError(event, fallbackUrl)}
                />
            </span>
        );
    }

    if (fan?.avatar_emoji) {
        return (
            <span className={`mf-lb-avatar ${sizeClass}`} aria-hidden>
                <span className="mf-lb-avatar__emoji">{fan.avatar_emoji}</span>
            </span>
        );
    }

    const initial = (fan?.handle || '?').replace(/^@/, '').slice(0, 1).toUpperCase();

    return (
        <span className={`mf-lb-avatar mf-lb-avatar--mark ${sizeClass}`} aria-hidden>
            <span className="mf-lb-avatar__initial mf-display">{initial}</span>
        </span>
    );
}
