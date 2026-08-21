import { Form, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { socialApi } from '../../../lib/socialApi';
import {
    applyOptimisticProps,
    prependFeedPost,
    patchPostInProps,
    removePostFromProps,
    runSocialMutation,
    setAuthorFollowInProps,
    useSocialFlash,
    withRollbackFlash,
} from '../optimistic';

function formatTime(iso) {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            month: 'short',
            day: 'numeric',
        }).format(new Date(iso));
    } catch {
        return '';
    }
}

function formatCount(value) {
    const n = Number(value) || 0;
    if (n >= 1_000_000) {
        return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    }
    if (n >= 10_000) {
        return `${Math.round(n / 1000)}K`;
    }
    if (n >= 1000) {
        return `${(n / 1000).toFixed(1)}K`;
    }
    return String(n);
}

function IconReply() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14 4 9l5-5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h9a6 6 0 0 1 6 6v2" />
        </svg>
    );
}

function IconHeart({ filled }) {
    return filled ? (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 20.5s-7.2-4.35-9.2-8.3C1.35 9.2 2.7 6 6.1 5.55c1.85-.24 3.45.7 4.4 2.05.95-1.35 2.55-2.29 4.4-2.05 3.4.45 4.75 3.65 3.3 6.65-2 3.95-9.2 8.3-9.2 8.3Z" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12.2 8.1A3.7 3.7 0 0 1 18 9.6c.7 1.9-.2 3.9-1.8 5.4L12 19.1l-4.2-4.1C6.2 13.5 5.3 11.5 6 9.6a3.7 3.7 0 0 1 5.8-1.8l.4.3Z"
            />
        </svg>
    );
}

function IconRepost() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m7 7 3-3 3 3" />
            <path strokeLinecap="round" d="M10 4v9a4 4 0 0 0 4 4h3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m17 17-3 3-3-3" />
            <path strokeLinecap="round" d="M14 20V11a4 4 0 0 0-4-4H7" />
        </svg>
    );
}

function IconQuote() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" d="M8 17h.01M12 17h.01M16 17h.01" />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.5 7.5A2.5 2.5 0 0 1 9 5h6a2.5 2.5 0 0 1 2.5 2.5v4A2.5 2.5 0 0 1 15 14H9.5L6.5 16.5V7.5Z"
            />
        </svg>
    );
}

function IconViews() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
            />
            <circle cx="12" cy="12" r="2.5" />
        </svg>
    );
}

function IconImage() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="3.5" y="5" width="17" height="14" rx="2" strokeWidth="1.75" />
            <circle cx="9" cy="10" r="1.6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="m7.5 16.5 3.2-3.4 2.4 2.2 3-3.8 3.4 5" />
        </svg>
    );
}

function IconMore() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="5" cy="12" r="1.75" />
            <circle cx="12" cy="12" r="1.75" />
            <circle cx="19" cy="12" r="1.75" />
        </svg>
    );
}

function ActionCount({ value }) {
    return <span className="mf-action__count">{formatCount(value)}</span>;
}

function MediaGrid({ media }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    if (!media?.length) {
        return null;
    }

    const count = Math.min(media.length, 4);
    const items = media.slice(0, 4);

    return (
        <div className={`mf-media mf-media--${count}`} role="group" aria-label="Attachments">
            {items.map((item, index) => (
                <div key={item.id} className={`mf-media__cell mf-media__cell--${index + 1}`}>
                    <img
                        src={item.url}
                        alt=""
                        loading="lazy"
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                </div>
            ))}
        </div>
    );
}

function EmbeddedPost({ embed, label }) {
    if (!embed) {
        return null;
    }

    return (
        <div className="mf-embed">
            {label ? (
                <p className="mf-text-caption mb-1.5 text-[var(--mf-muted)]">{label}</p>
            ) : null}
            <p className="mf-text-meta text-[var(--mf-muted)]">
                <span className="font-semibold text-[var(--mf-text)]">{embed.author?.name}</span>
            </p>
            {embed.body ? (
                <p className="mf-text-ui mt-1 whitespace-pre-wrap text-[var(--mf-text)]">{embed.body}</p>
            ) : null}
            <MediaGrid media={embed.media} />
        </div>
    );
}

function PostOverflowMenu({ post, onDismiss }) {
    const menuId = useId();
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const { reportError, reportSuccess } = useSocialFlash();
    const isOwn = Boolean(post.is_own || post.can_delete);
    const bookmarked = Boolean(post.bookmarked_by_viewer);
    const hidden = Boolean(post.hidden_by_viewer);
    const following = Boolean(post.viewer_follows_author);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function onPointerDown(event) {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    function run(action) {
        setOpen(false);
        action();
    }

    async function copyLink() {
        const url = `${window.location.origin}/social/posts/${post.id}`;
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            window.prompt('Copy link', url);
        }
    }

    return (
        <div className="mf-overflow" ref={rootRef}>
            <button
                type="button"
                className={`mf-overflow__trigger ${open ? 'is-open' : ''}`}
                aria-label="Post actions"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setOpen((value) => !value);
                }}
            >
                <IconMore />
            </button>

            {open ? (
                <ul id={menuId} role="menu" className="mf-overflow__menu" aria-label="Post actions">
                    <li role="none">
                        <button
                            type="button"
                            role="menuitem"
                            className="mf-overflow__item"
                            onClick={() =>
                                run(() => {
                                    const next = !bookmarked;
                                    const visit = router.optimistic((props) =>
                                        patchPostInProps(props, post.id, (item) => ({
                                            ...item,
                                            bookmarked_by_viewer: next,
                                        })),
                                    );
                                    const opts = withRollbackFlash(reportError);

                                    if (bookmarked) {
                                        visit.delete(`/social/posts/${post.id}/bookmark`, opts);
                                        return;
                                    }
                                    visit.post(`/social/posts/${post.id}/bookmark`, {}, opts);
                                })
                            }
                        >
                            {bookmarked ? 'Remove bookmark' : 'Bookmark'}
                        </button>
                    </li>

                    <li role="none">
                        <button type="button" role="menuitem" className="mf-overflow__item" onClick={() => run(copyLink)}>
                            Copy link
                        </button>
                    </li>

                    {post.can_follow_author ? (
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="mf-overflow__item"
                                onClick={() =>
                                    run(() => {
                                        const authorId = post.author?.id;
                                        if (!authorId) {
                                            return;
                                        }
                                        const next = !following;
                                        void runSocialMutation(
                                            (props) => setAuthorFollowInProps(props, authorId, next),
                                            () =>
                                                socialApi(`/users/${authorId}/follow`, {
                                                    method: following ? 'DELETE' : 'POST',
                                                }),
                                            {
                                                reportError,
                                                reportSuccess,
                                                errorFallback: following
                                                    ? 'Unfollow failed — rolled back.'
                                                    : 'Follow failed — rolled back.',
                                            },
                                        );
                                    })
                                }
                            >
                                {following
                                    ? `Unfollow ${post.author?.name || 'fan'}`
                                    : `Follow ${post.author?.name || 'fan'}`}
                            </button>
                        </li>
                    ) : null}

                    {post.can_hide ? (
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="mf-overflow__item"
                                onClick={() =>
                                    run(() => {
                                        if (hidden) {
                                            router
                                                .optimistic((props) =>
                                                    patchPostInProps(props, post.id, (item) => ({
                                                        ...item,
                                                        hidden_by_viewer: false,
                                                    })),
                                                )
                                                .delete(
                                                    `/social/posts/${post.id}/not-interested`,
                                                    withRollbackFlash(reportError),
                                                );
                                            return;
                                        }
                                        onDismiss?.(post.id);
                                        router
                                            .optimistic((props) => removePostFromProps(props, post.id))
                                            .post(
                                                `/social/posts/${post.id}/not-interested`,
                                                {},
                                                withRollbackFlash(reportError, {
                                                    onError: () => {
                                                        /* rollback restores feed; clear local dismiss if used */
                                                    },
                                                }),
                                            );
                                    })
                                }
                            >
                                {hidden ? 'Interested' : 'Not interested'}
                            </button>
                        </li>
                    ) : null}

                    {!isOwn ? (
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="mf-overflow__item is-danger"
                                onClick={() =>
                                    run(() => {
                                        onDismiss?.(post.id);
                                        router
                                            .optimistic((props) => removePostFromProps(props, post.id))
                                            .post(
                                                `/social/posts/${post.id}/report`,
                                                { reason: 'spam' },
                                                withRollbackFlash(reportError),
                                            );
                                    })
                                }
                            >
                                Report
                            </button>
                        </li>
                    ) : null}

                    {post.can_delete ? (
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="mf-overflow__item is-danger"
                                onClick={() =>
                                    run(() => {
                                        onDismiss?.(post.id);
                                        router
                                            .optimistic((props) => removePostFromProps(props, post.id))
                                            .delete(
                                                `/social/posts/${post.id}`,
                                                withRollbackFlash(reportError),
                                            );
                                    })
                                }
                            >
                                Delete
                            </button>
                        </li>
                    ) : null}
                </ul>
            ) : null}
        </div>
    );
}

export default function PostCard({ post, compact = false, onDismiss }) {
    const [quoting, setQuoting] = useState(false);
    const [likePop, setLikePop] = useState(false);
    const { reportError, reportSuccess } = useSocialFlash();
    const page = usePage();
    const viewer = page.props?.auth?.user;

    useEffect(() => {
        if (!likePop) {
            return undefined;
        }

        const timer = window.setTimeout(() => setLikePop(false), 240);

        return () => window.clearTimeout(timer);
    }, [likePop]);

    if (!post) {
        return null;
    }

    const liked = Boolean(post.liked_by_viewer);
    const handle = post.author?.handle;
    const isRepost = post.type === 'repost';
    const isPending = Boolean(post._optimistic);

    function toggleLike(event) {
        event.preventDefault();
        event.stopPropagation();

        if (isPending) {
            return;
        }

        const nextLiked = !liked;
        if (nextLiked) {
            setLikePop(true);
        }

        void runSocialMutation(
            (props) =>
                patchPostInProps(props, post.id, (item) => ({
                    ...item,
                    liked_by_viewer: nextLiked,
                    likes_count: Math.max(0, (item.likes_count || 0) + (nextLiked ? 1 : -1)),
                })),
            () =>
                socialApi(`/posts/${post.id}/like`, {
                    method: nextLiked ? 'POST' : 'DELETE',
                }),
            {
                reportError,
                reportSuccess,
                errorFallback: nextLiked ? 'Like failed — rolled back.' : 'Unlike failed — rolled back.',
                onSuccess: (data) => {
                    if (typeof data?.likes_count === 'number') {
                        applyOptimisticProps((props) =>
                            patchPostInProps(props, post.id, (item) => ({
                                ...item,
                                liked_by_viewer: Boolean(data.liked),
                                likes_count: data.likes_count,
                            })),
                        );
                    }
                },
            },
        );
    }

    function repost() {
        if (isPending) {
            return;
        }

        const tempId = `tmp-repost-${Date.now()}`;
        router
            .optimistic((props) => {
                const patched = patchPostInProps(props, post.id, (item) => ({
                    ...item,
                    reposts_count: (item.reposts_count || 0) + 1,
                }));
                const pending = {
                    id: tempId,
                    body: null,
                    type: 'repost',
                    likes_count: 0,
                    replies_count: 0,
                    reposts_count: 0,
                    quotes_count: 0,
                    views_count: 0,
                    liked_by_viewer: false,
                    bookmarked_by_viewer: false,
                    hidden_by_viewer: false,
                    viewer_follows_author: false,
                    is_own: true,
                    published_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    author: {
                        id: viewer?.id,
                        name: viewer?.name || 'You',
                        handle: viewer?.handle || viewer?.fan_id,
                    },
                    club: post.club || null,
                    media: [],
                    quote_of: null,
                    repost_of: {
                        id: post.id,
                        body: post.body,
                        author: post.author,
                        media: post.media,
                    },
                    can_delete: true,
                    can_repost: false,
                    can_hide: false,
                    can_follow_author: false,
                    _optimistic: true,
                };
                return {
                    ...patched,
                    ...prependFeedPost({ ...props, ...patched }, pending),
                };
            })
            .post(`/social/posts/${post.id}/repost`, {}, withRollbackFlash(reportError));
    }

    return (
        <article
            className={`mf-post${compact ? ' mf-post--compact' : ''}${isPending ? ' is-optimistic' : ''}`}
        >
            {isRepost ? (
                <p className="mf-repost-banner">
                    <IconRepost />
                    <span>{post.author?.name} reposted</span>
                </p>
            ) : null}

            <div className="mf-post__row">
                <Link
                    href={handle ? `/social/u/${handle}` : '/social'}
                    className="mf-avatar mf-text-meta h-10 w-10"
                    aria-label={`${post.author?.name || 'Fan'} profile`}
                >
                    {(post.author?.name || '?').slice(0, 1).toUpperCase()}
                </Link>

                <div className="mf-post__body">
                    <div className="mf-post__header">
                        <div className="mf-post__meta">
                            <Link
                                href={handle ? `/social/u/${handle}` : '/social'}
                                className="mf-post__name"
                            >
                                {post.author?.name}
                            </Link>
                            {post.club?.short || post.club?.name ? (
                                <span className="mf-club-flake">
                                    {post.club.short || post.club.name}
                                </span>
                            ) : null}
                            <span className="mf-post__dot" aria-hidden>
                                ·
                            </span>
                            <time
                                className="mf-text-meta text-[var(--mf-muted)]"
                                dateTime={post.published_at || post.created_at || undefined}
                            >
                                {formatTime(post.published_at || post.created_at)}
                            </time>
                        </div>

                        <PostOverflowMenu post={post} onDismiss={onDismiss} />
                    </div>

                    <Link href={`/social/posts/${post.id}`} className="mf-post__content">
                        {post.body ? (
                            <p className={`mf-post__text whitespace-pre-wrap ${compact ? 'mf-text-ui' : 'mf-text-body'}`}>
                                {post.body}
                            </p>
                        ) : null}
                    </Link>

                    <MediaGrid media={post.media} />
                    <EmbeddedPost embed={post.quote_of} label="Quote" />
                    <EmbeddedPost embed={post.repost_of} />

                    <div className="mf-actions" aria-label="Engagement">
                        <Link href={`/social/posts/${post.id}`} className="mf-action" aria-label={`Replies, ${post.replies_count || 0}`}>
                            <IconReply />
                            <ActionCount value={post.replies_count || 0} />
                        </Link>

                        <button
                            type="button"
                            onClick={toggleLike}
                            className={`mf-action ${liked ? 'is-liked' : ''} ${likePop ? 'mf-like-pop' : ''}`}
                            aria-pressed={liked}
                            aria-label={`Likes, ${post.likes_count || 0}`}
                            disabled={isPending}
                        >
                            <IconHeart filled={liked} />
                            <ActionCount value={post.likes_count || 0} />
                        </button>

                        {post.can_repost ? (
                            <button
                                type="button"
                                onClick={repost}
                                className="mf-action"
                                aria-label={`Reposts, ${post.reposts_count || 0}`}
                                disabled={isPending}
                            >
                                <IconRepost />
                                <ActionCount value={post.reposts_count || 0} />
                            </button>
                        ) : (
                            <span className="mf-action" aria-label={`Reposts, ${post.reposts_count || 0}`}>
                                <IconRepost />
                                <ActionCount value={post.reposts_count || 0} />
                            </span>
                        )}

                        <span className="mf-action mf-action--stat" aria-label={`Views, ${post.views_count || 0}`}>
                            <IconViews />
                            <ActionCount value={post.views_count || 0} />
                        </span>

                        {post.can_repost ? (
                            <button
                                type="button"
                                onClick={() => setQuoting((value) => !value)}
                                className={`mf-action mf-action--quote ${quoting ? 'is-active' : ''}`}
                                aria-expanded={quoting}
                                aria-label="Quote"
                                disabled={isPending}
                            >
                                <IconQuote />
                                <span className="mf-action__label">Quote</span>
                            </button>
                        ) : null}
                    </div>

                    {quoting ? (
                        <Form
                            action={`/social/posts/${post.id}/quote`}
                            method="post"
                            resetOnSuccess
                            className="mf-quote-form"
                            onSuccess={() => setQuoting(false)}
                            onError={(errors) => {
                                reportError(
                                    typeof errors?.body === 'string'
                                        ? errors.body
                                        : 'Quote failed — rolled back.',
                                );
                            }}
                            optimistic={(props, data) => {
                                const body = (data?.body || '').trim();
                                const tempId = `tmp-quote-${Date.now()}`;
                                const patched = patchPostInProps(props, post.id, (item) => ({
                                    ...item,
                                    quotes_count: (item.quotes_count || 0) + 1,
                                }));
                                const pending = {
                                    id: tempId,
                                    body,
                                    type: 'quote',
                                    likes_count: 0,
                                    replies_count: 0,
                                    reposts_count: 0,
                                    quotes_count: 0,
                                    views_count: 0,
                                    liked_by_viewer: false,
                                    bookmarked_by_viewer: false,
                                    hidden_by_viewer: false,
                                    viewer_follows_author: false,
                                    is_own: true,
                                    published_at: new Date().toISOString(),
                                    created_at: new Date().toISOString(),
                                    author: {
                                        id: viewer?.id,
                                        name: viewer?.name || 'You',
                                        handle: viewer?.handle || viewer?.fan_id,
                                    },
                                    club: post.club || null,
                                    media: [],
                                    quote_of: {
                                        id: post.id,
                                        body: post.body,
                                        author: post.author,
                                        media: post.media,
                                    },
                                    repost_of: null,
                                    can_delete: true,
                                    can_repost: false,
                                    can_hide: false,
                                    can_follow_author: false,
                                    _optimistic: true,
                                };
                                return {
                                    ...patched,
                                    ...prependFeedPost({ ...props, ...patched }, pending),
                                };
                            }}
                        >
                            {({ errors, processing }) => (
                                <>
                                    <textarea
                                        name="body"
                                        rows={2}
                                        maxLength={280}
                                        placeholder="Add a take…"
                                        className="mf-field"
                                    />
                                    {errors.body ? (
                                        <p className="mf-field-error">{errors.body}</p>
                                    ) : null}
                                    <div className="mt-2 flex gap-2">
                                        <button type="submit" disabled={processing} className="mf-btn mf-btn--pitch !min-h-8 !px-3">
                                            Quote
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuoting(false)}
                                            className="mf-btn mf-btn--ghost !min-h-8 !px-3"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </Form>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

export function FeedComposer({
    maxBodyLength = 280,
    maxImages = 4,
    action = '/social/posts',
    placeholder = 'What’s happening on the terrace?',
    autoFocus = false,
    onSuccess,
    variant = 'sheet',
}) {
    const page = usePage();
    const user = page.props?.auth?.user;
    const initial = (user?.name || user?.handle || '?').slice(0, 1).toUpperCase();
    const inputId = useId();
    const { reportError } = useSocialFlash();

    const { data, setData, errors } = useForm({
        body: '',
        images: [],
    });

    const [previews, setPreviews] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const next = (data.images || []).map((file, index) => ({
            id: `${file.name}-${index}-${file.size}`,
            url: URL.createObjectURL(file),
            name: file.name,
        }));

        setPreviews(next);

        return () => {
            next.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [data.images]);

    const remaining = maxBodyLength - data.body.length;
    const nearLimit = remaining <= 20;
    const canPost = Boolean(data.body.trim() || data.images?.length > 0);
    const busy = submitting;

    function submit(event) {
        event.preventDefault();
        if (!canPost || busy) {
            return;
        }

        const body = data.body.trim();
        const images = [...(data.images || [])];
        const tempId = `tmp-post-${Date.now()}`;
        const hasImages = images.length > 0;

        setSubmitting(true);

        router
            .optimistic((props) =>
                prependFeedPost(props, {
                    id: tempId,
                    body: body || (hasImages ? 'Uploading media…' : null),
                    type: 'post',
                    likes_count: 0,
                    replies_count: 0,
                    reposts_count: 0,
                    quotes_count: 0,
                    views_count: 0,
                    liked_by_viewer: false,
                    bookmarked_by_viewer: false,
                    hidden_by_viewer: false,
                    viewer_follows_author: false,
                    is_own: true,
                    published_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    author: {
                        id: user?.id,
                        name: user?.name || 'You',
                        handle: user?.handle || user?.fan_id,
                    },
                    club: null,
                    media: [],
                    quote_of: null,
                    repost_of: null,
                    can_delete: true,
                    can_repost: false,
                    can_hide: false,
                    can_follow_author: false,
                    _optimistic: true,
                }),
            )
            .post(
                action,
                { body, images },
                withRollbackFlash(reportError, {
                    forceFormData: true,
                    preserveScroll: true,
                }),
            );

        // Close sheet immediately; router visit is not tied to this component's lifetime.
        onSuccess?.();
        setSubmitting(false);
    }

    function onKeyDown(event) {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            submit(event);
        }
    }

    return (
        <form
            onSubmit={submit}
            className={`mf-composer ${variant === 'sheet' ? 'mf-composer--sheet' : ''}`}
            encType="multipart/form-data"
        >
            <div className="mf-composer__row">
                <div className="mf-avatar mf-text-meta h-10 w-10 shrink-0" aria-hidden>
                    {initial}
                </div>
                <div className="mf-composer__main">
                    <label className="sr-only" htmlFor={inputId}>
                        Compose post
                    </label>
                    <textarea
                        id={inputId}
                        name="body"
                        rows={variant === 'sheet' ? 5 : 3}
                        maxLength={maxBodyLength}
                        value={data.body}
                        onChange={(event) => setData('body', event.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder}
                        className="mf-composer__input"
                        autoFocus={autoFocus}
                    />

                    {previews.length > 0 ? (
                        <div className="mf-composer-previews">
                            {previews.map((preview) => (
                                <div key={preview.id} className="mf-composer-previews__item">
                                    <img src={preview.url} alt="" />
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {errors.body ? <p className="mf-field-error">{errors.body}</p> : null}
                    {errors.images ? <p className="mf-field-error">{errors.images}</p> : null}

                    <div className="mf-composer__bar">
                        <div className="mf-composer__tools">
                            <label className="mf-composer-attach">
                                <IconImage />
                                <span>Media</span>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    multiple
                                    className="hidden"
                                    onChange={(event) => {
                                        const files = Array.from(event.target.files || []).slice(0, maxImages);
                                        setData('images', files);
                                    }}
                                />
                            </label>
                            <span className={`mf-mono mf-text-meta ${nearLimit ? 'text-[var(--mf-amber)]' : 'text-[var(--mf-muted)]'}`}>
                                {data.body.length}/{maxBodyLength}
                                {data.images?.length ? ` · ${data.images.length}/${maxImages}` : ''}
                            </span>
                        </div>
                        <button
                            type="submit"
                            disabled={busy || !canPost}
                            className="mf-btn mf-btn--pitch"
                        >
                            {busy ? 'Posting…' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}

export function ComposeSheet({ open, onClose, maxBodyLength = 280, maxImages = 4 }) {
    const titleId = useId();

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div className="mf-sheet" role="presentation">
            <button type="button" className="mf-sheet__backdrop" aria-label="Close composer" onClick={onClose} />
            <div
                className="mf-sheet__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div className="mf-sheet__handle" aria-hidden />
                <div className="mf-sheet__head">
                    <p id={titleId} className="mf-display mf-text-title tracking-[0.03em]">
                        New post
                    </p>
                    <button type="button" className="mf-sheet__close" onClick={onClose}>
                        Cancel
                    </button>
                </div>
                <FeedComposer
                    maxBodyLength={maxBodyLength}
                    maxImages={maxImages}
                    autoFocus
                    onSuccess={onClose}
                    variant="sheet"
                />
            </div>
        </div>
    );
}

export function ReplyComposer({ postId, maxBodyLength = 280 }) {
    const page = usePage();
    const viewer = page.props?.auth?.user;
    const { reportError } = useSocialFlash();

    return (
        <Form
            action={`/social/posts/${postId}/replies`}
            method="post"
            resetOnSuccess
            className="mf-composer mf-composer--reply"
            onError={(errors) => {
                reportError(
                    typeof errors?.body === 'string' ? errors.body : 'Reply failed — rolled back.',
                );
            }}
            optimistic={(props, data) => {
                const body = (data?.body || '').trim();
                const tempId = `tmp-reply-${Date.now()}`;
                const pending = {
                    id: tempId,
                    body,
                    type: 'reply',
                    likes_count: 0,
                    replies_count: 0,
                    reposts_count: 0,
                    quotes_count: 0,
                    views_count: 0,
                    liked_by_viewer: false,
                    bookmarked_by_viewer: false,
                    hidden_by_viewer: false,
                    viewer_follows_author: false,
                    is_own: true,
                    published_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    author: {
                        id: viewer?.id,
                        name: viewer?.name || 'You',
                        handle: viewer?.handle || viewer?.fan_id,
                    },
                    club: null,
                    media: [],
                    quote_of: null,
                    repost_of: null,
                    can_delete: true,
                    can_repost: false,
                    can_hide: false,
                    can_follow_author: false,
                    _optimistic: true,
                };

                return {
                    ...patchPostInProps(props, postId, (item) => ({
                        ...item,
                        replies_count: (item.replies_count || 0) + 1,
                    })),
                    replies: [...(props.replies || []), pending],
                };
            }}
        >
            {({ errors, processing }) => (
                <>
                    <label className="sr-only" htmlFor="reply-composer">
                        Reply
                    </label>
                    <textarea
                        id="reply-composer"
                        name="body"
                        rows={2}
                        maxLength={maxBodyLength}
                        placeholder="Reply on the terrace…"
                        className="mf-composer__input"
                    />
                    {errors.body ? <p className="mf-field-error">{errors.body}</p> : null}
                    <div className="mf-composer__bar">
                        <span className="mf-text-meta text-[var(--mf-muted)]">Terrace reply</span>
                        <button type="submit" disabled={processing} className="mf-btn mf-btn--pitch">
                            {processing ? 'Sending…' : 'Reply'}
                        </button>
                    </div>
                </>
            )}
        </Form>
    );
}
