import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { socialApi } from '../../../../lib/socialApi';

/**
 * One followable fandom — the "Popular Fandoms" card. Cover photo when the
 * category has one; otherwise an icon-tinted panel so the card never shows a
 * broken image or a generic stock placeholder (see Fandom::cover_image_url).
 */
export default function FandomCard({ fandom, onFollowChange }) {
    const [following, setFollowing] = useState(fandom.is_following);
    const [fanCount, setFanCount] = useState(fandom.fan_count);
    const [pending, setPending] = useState(false);

    function toggleFollow(event) {
        event.preventDefault();
        if (pending) {
            return;
        }

        const next = !following;
        setPending(true);
        setFollowing(next);
        setFanCount((count) => count + (next ? 1 : -1));

        socialApi(`/fandoms/${fandom.id}/follow`, { method: next ? 'POST' : 'DELETE' })
            .then((data) => {
                setFollowing(data.following);
                setFanCount(data.fan_count);
                onFollowChange?.(fandom.id, data.following);
            })
            .catch(() => {
                setFollowing(!next);
                setFanCount((count) => count - (next ? 1 : -1));
            })
            .finally(() => setPending(false));
    }

    return (
        <article className="mf-fd-card">
            <Link href={`/social/fandom/${fandom.slug}`} className="mf-fd-card__link">
                <div
                    className={`mf-fd-card__cover ${!fandom.cover_image_url ? 'mf-fd-card__cover--icon' : ''}`.trim()}
                    style={fandom.cover_image_url ? { backgroundImage: `url(${fandom.cover_image_url})` } : undefined}
                >
                    <span className="mf-fd-card__badge" aria-hidden>
                        {fandom.icon}
                    </span>
                </div>
                <p className="mf-fd-card__name truncate">{fandom.name}</p>
                <p className="mf-fd-card__count mf-mono">{fanCount.toLocaleString()} fans</p>
            </Link>
            <button
                type="button"
                className={`mf-btn ${following ? 'mf-btn--ghost' : 'mf-btn--pitch'} mf-fd-card__follow`}
                onClick={toggleFollow}
                disabled={pending}
            >
                {following ? 'Following' : 'Follow'}
            </button>
        </article>
    );
}
