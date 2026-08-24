import { Link } from '@inertiajs/react';
import { formatFullTime, formatRelative } from './format';
import PostOverflowMenu from './PostOverflowMenu';

/**
 * Post header row: avatar, display name, @handle, club flake, timestamp, ⋯ menu.
 *
 * @param {{ post: object, onDismiss?: (id:any)=>void, size?: 'md'|'sm' }} props
 */
export default function PostHeader({ post, onDismiss, size = 'md' }) {
    const handle = post.author?.handle;
    const profileHref = handle ? `/social/u/${handle}` : '/social';
    const stamp = post.published_at || post.created_at;
    const avatarSize = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';

    return (
        <div className="mf-post__header-row">
            <Link
                href={profileHref}
                className={`mf-avatar mf-text-meta ${avatarSize}`}
                aria-label={`${post.author?.name || 'Fan'} profile`}
            >
                {(post.author?.name || '?').slice(0, 1).toUpperCase()}
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
                </div>

                <PostOverflowMenu post={post} onDismiss={onDismiss} />
            </div>
        </div>
    );
}
