import { Link, usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../../lib/defaultImage';
import { formatFullTime, formatRelative } from './format';
import PostOverflowMenu from './PostOverflowMenu';
import { IconClubShield, IconLock } from './icons';

/** Non-public audiences get a small glyph next to the timestamp. */
const VISIBILITY_GLYPH = {
    club: { Icon: IconClubShield, label: 'Club only' },
    only_me: { Icon: IconLock, label: 'Only you' },
};

/**
 * Post header row: avatar, display name, @handle, club flake, timestamp,
 * audience glyph, ⋯ menu.
 *
 * @param {{ post: object, onDismiss?: (id:any)=>void, size?: 'md'|'sm' }} props
 */
export default function PostHeader({ post, onDismiss, size = 'md' }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const handle = post.author?.handle;
    const profileHref = handle ? `/social/u/${handle}` : '/social';
    const stamp = post.published_at || post.created_at;
    const avatarSize = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
    const audience = VISIBILITY_GLYPH[post.visibility];
    const AudienceIcon = audience?.Icon;

    return (
        <div className="mf-post__header-row">
            <Link
                href={profileHref}
                className={`mf-avatar mf-text-meta ${avatarSize}`}
                aria-label={`${post.author?.name || 'Fan'} profile`}
            >
                {post.author?.avatar_url ? (
                    <img
                        src={post.author.avatar_url}
                        alt=""
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : (
                    (post.author?.name || '?').slice(0, 1).toUpperCase()
                )}
            </Link>

            <div className="mf-post__header">
                <div className="mf-post__meta">
                    <Link href={profileHref} className="mf-post__name">
                        {post.author?.name}
                    </Link>
                    {handle ? (
                        <Link href={profileHref} className="mf-post__handle">
                            @{handle}
                        </Link>
                    ) : null}
                    {post.club?.short || post.club?.name ? (
                        <span className="mf-club-flake">{post.club.short || post.club.name}</span>
                    ) : null}
                    <span className="mf-post__dot" aria-hidden>
                        ·
                    </span>
                    <time
                        className="mf-text-meta text-[var(--mf-muted)]"
                        dateTime={stamp || undefined}
                        title={formatFullTime(stamp)}
                    >
                        {formatRelative(stamp)}
                    </time>
                    {AudienceIcon ? (
                        <span className="mf-post__audience" title={audience.label} aria-label={audience.label}>
                            <AudienceIcon />
                        </span>
                    ) : null}
                </div>

                <PostOverflowMenu post={post} onDismiss={onDismiss} />
            </div>
        </div>
    );
}
