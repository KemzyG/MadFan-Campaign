import { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { socialApi } from '../../../../lib/socialApi';
import { useAuthGate } from '../../authGate';
import {
    applyOptimisticProps,
    patchPostInProps,
    prependFeedPost,
    runSocialMutation,
    useSocialFlash,
    withRollbackFlash,
} from '../../optimistic';
import { formatCount } from './format';
import { IconComment, IconHeart, IconQuote, IconRepost, IconViews } from './icons';
import QuoteComposer from './QuoteComposer';

function ActionCount({ value }) {
    return <span className="mf-action__count">{formatCount(value)}</span>;
}

/**
 * Engagement row: comment, like, repost, views, quote.
 *
 * @param {{
 *   post: object,
 *   maxBodyLength?: number,
 *   onReply?: () => void,   // when set, the comment button toggles an inline reply (thread mode)
 * }} props
 */
export default function PostActions({ post, maxBodyLength = 280, onReply }) {
    const [quoting, setQuoting] = useState(false);
    const [likePop, setLikePop] = useState(false);
    const { reportError, reportSuccess } = useSocialFlash();
    const { requireAuth } = useAuthGate();
    const page = usePage();
    const viewer = page.props?.auth?.user;

    const liked = Boolean(post.liked_by_viewer);
    const isPending = Boolean(post._optimistic);

    useEffect(() => {
        if (!likePop) {
            return undefined;
        }
        const timer = window.setTimeout(() => setLikePop(false), 240);
        return () => window.clearTimeout(timer);
    }, [likePop]);

    function toggleLike(event) {
        event.preventDefault();
        event.stopPropagation();

        if (isPending || !requireAuth('like this post')) {
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
        if (isPending || !requireAuth('repost this')) {
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

    const replyCount = post.replies_count || 0;

    return (
        <>
            <div className="mf-actions" aria-label="Engagement">
                {onReply ? (
                    <button
                        type="button"
                        onClick={onReply}
                        className="mf-action mf-action--comment"
                        aria-label={`Reply · ${replyCount} comments`}
                    >
                        <IconComment />
                        <ActionCount value={replyCount} />
                    </button>
                ) : (
                    <Link
                        href={`/social/posts/${post.id}`}
                        className="mf-action mf-action--comment"
                        aria-label={`Comments, ${replyCount}`}
                    >
                        <IconComment />
                        <ActionCount value={replyCount} />
                    </Link>
                )}

                <button
                    type="button"
                    onClick={toggleLike}
                    className={`mf-action mf-action--like ${liked ? 'is-liked' : ''} ${likePop ? 'mf-like-pop' : ''}`}
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
                        className="mf-action mf-action--repost"
                        aria-label={`Reposts, ${post.reposts_count || 0}`}
                        disabled={isPending}
                    >
                        <IconRepost />
                        <ActionCount value={post.reposts_count || 0} />
                    </button>
                ) : (
                    <span className="mf-action mf-action--repost" aria-label={`Reposts, ${post.reposts_count || 0}`}>
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
                <QuoteComposer post={post} maxBodyLength={maxBodyLength} onClose={() => setQuoting(false)} />
            ) : null}
        </>
    );
}
