import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { socialApi } from '../../../lib/socialApi';

function SuggestionCard({ user }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const [following, setFollowing] = useState(false);
    const [pending, setPending] = useState(false);

    function follow(event) {
        event.preventDefault();
        event.stopPropagation();

        if (pending || following) {
            return;
        }

        setPending(true);
        socialApi(`/users/${user.id}/follow`, { method: 'POST' })
            .then(() => setFollowing(true))
            .catch(() => {})
            .finally(() => setPending(false));
    }

    return (
        <Link href={`/social/u/${user.handle}`} className="mf-suggest-card">
            <span className="mf-suggest-card__avatar" aria-hidden>
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" onError={(event) => onImageError(event, fallbackUrl)} />
                ) : (
                    <span>{(user.name || '?').slice(0, 1).toUpperCase()}</span>
                )}
            </span>
            <span className="mf-suggest-card__name truncate">{user.name}</span>
            <span className="mf-suggest-card__meta truncate">
                {user.club?.short || `@${user.handle}`}
            </span>
            <button
                type="button"
                className={`mf-suggest-card__follow ${following ? 'is-following' : ''}`}
                onClick={follow}
                disabled={pending || following}
            >
                {following ? 'Following' : pending ? '…' : 'Follow'}
            </button>
        </Link>
    );
}

/**
 * "Fans to follow" — a horizontally-scrollable strip dropped at a pseudo-random
 * point in the feed stream (see Feed.jsx) rather than pinned to one spot, so it
 * reads as part of the terrace rather than a fixed ad slot.
 */
export default function FriendSuggestions({ suggestions }) {
    const people = suggestions || [];

    if (people.length === 0) {
        return null;
    }

    return (
        <div className="mf-suggest-strip" aria-label="Fans to follow">
            <p className="mf-suggest-strip__label">Fans to follow</p>
            <div className="mf-suggest-strip__row">
                {people.map((user) => (
                    <SuggestionCard key={user.id} user={user} />
                ))}
            </div>
        </div>
    );
}
