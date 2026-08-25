import { Link, usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { socialApi } from '../../../lib/socialApi';
import { formatRelative } from '../components/post/format';

function IconAvatarFallback({ label }) {
    return (
        <span className="mf-notif-row__avatar-fallback mf-display" aria-hidden>
            {(label || '?').slice(0, 1).toUpperCase()}
        </span>
    );
}

/**
 * One notification. Marks itself read (fire-and-forget) the moment it's
 * opened, then follows through to whatever it's about.
 */
export default function NotificationRow({ notification, onRead }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const { id, type, read, actor, message, href, created_at: createdAt } = notification;

    function markRead() {
        if (read) {
            return;
        }

        onRead?.(id);
        socialApi(`/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
    }

    const content = (
        <>
            <span className="mf-notif-row__avatar">
                {actor?.avatar_url ? (
                    <img
                        src={actor.avatar_url}
                        alt=""
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    <IconAvatarFallback label={actor?.name || actor?.handle} />
                )}
            </span>
            <span className="mf-notif-row__body">
                <span className="mf-notif-row__message">{message}</span>
                <span className="mf-notif-row__time mf-text-micro">{formatRelative(createdAt)}</span>
            </span>
            {!read ? <span className="mf-notif-row__dot" aria-hidden /> : null}
        </>
    );

    return (
        <li className={`mf-notif-row${read ? '' : ' is-unread'}`} data-type={type}>
            {href ? (
                <Link href={href} className="mf-notif-row__link" onClick={markRead} preserveScroll>
                    {content}
                </Link>
            ) : (
                <button type="button" className="mf-notif-row__link" onClick={markRead}>
                    {content}
                </button>
            )}
        </li>
    );
}
