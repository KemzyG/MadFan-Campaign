import { Form, usePage } from '@inertiajs/react';
import { useAuthGate } from '../../authGate';
import { patchPostInProps, useSocialFlash } from '../../optimistic';

/**
 * Reply composer. Posts a reply to `postId` (which may be the thread root or any
 * comment within it). The optimistic pending reply records `reply_to_id`/`root_id`
 * so the client-side thread tree nests it under the right parent.
 *
 * @param {{
 *   postId: any,                 // the post/comment being replied to
 *   rootId?: any,                // thread root id (defaults to postId)
 *   maxBodyLength?: number,
 *   variant?: 'page' | 'inline', // 'inline' = compact composer under a comment
 *   autoFocus?: boolean,
 *   placeholder?: string,
 *   onDone?: () => void,         // called after a successful submit
 * }} props
 */
export default function ReplyComposer({
    postId,
    rootId,
    maxBodyLength = 280,
    variant = 'page',
    autoFocus = false,
    placeholder = 'Reply on the terrace…',
    onDone,
}) {
    const page = usePage();
    const viewer = page.props?.auth?.user;
    const { reportError } = useSocialFlash();
    const { requireAuth } = useAuthGate();
    const inline = variant === 'inline';

    return (
        <Form
            action={`/social/posts/${postId}/replies`}
            method="post"
            resetOnSuccess
            className={`mf-composer mf-composer--reply${inline ? ' mf-composer--reply-inline' : ''}`}
            onBefore={() => requireAuth('reply')}
            onSuccess={() => onDone?.()}
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
                    reply_to_id: postId,
                    root_id: rootId ?? postId,
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

                const bumpReplies = (item) => ({
                    ...item,
                    replies_count: (item.replies_count || 0) + 1,
                });

                // A reply to a comment bumps that comment's own count, but the
                // root post's card is what the feed actually shows — if this
                // reply is nested (postId isn't the root), that count needs
                // the same +1 or it undercounts until the next full reload.
                let working = { ...props, ...patchPostInProps(props, postId, bumpReplies) };
                const effectiveRootId = rootId ?? postId;

                if (effectiveRootId !== postId) {
                    working = { ...working, ...patchPostInProps(working, effectiveRootId, bumpReplies) };
                }

                return {
                    ...working,
                    replies: [...(working.replies || props.replies || []), pending],
                };
            }}
        >
            {({ errors, processing }) => (
                <>
                    <label className="sr-only" htmlFor={`reply-${postId}`}>
                        Reply
                    </label>
                    <textarea
                        id={`reply-${postId}`}
                        name="body"
                        rows={2}
                        maxLength={maxBodyLength}
                        placeholder={placeholder}
                        className="mf-composer__input"
                        autoFocus={autoFocus}
                    />
                    {errors.body ? <p className="mf-field-error">{errors.body}</p> : null}
                    <div className="mf-composer__bar">
                        <span className="mf-text-meta text-[var(--mf-muted)]">
                            {inline ? 'Replying to comment' : 'Terrace reply'}
                        </span>
                        <div className="flex items-center gap-2">
                            {inline && onDone ? (
                                <button
                                    type="button"
                                    onClick={onDone}
                                    className="mf-btn mf-btn--ghost !min-h-8 !px-3"
                                >
                                    Cancel
                                </button>
                            ) : null}
                            <button type="submit" disabled={processing} className="mf-btn mf-btn--pitch">
                                {processing ? 'Sending…' : 'Reply'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </Form>
    );
}
