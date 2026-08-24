import { Form, router, usePage } from '@inertiajs/react';
import { patchPostInProps, prependFeedPost, useSocialFlash } from '../../optimistic';

/**
 * Inline "quote post" composer, shown under the action row when quoting.
 *
 * @param {{ post: object, maxBodyLength?: number, onClose: () => void }} props
 */
export default function QuoteComposer({ post, maxBodyLength = 280, onClose }) {
    const page = usePage();
    const viewer = page.props?.auth?.user;
    const { reportError } = useSocialFlash();

    return (
        <Form
            action={`/social/posts/${post.id}/quote`}
            method="post"
            resetOnSuccess
            className="mf-quote-form"
            onSuccess={onClose}
            onError={(errors) => {
                reportError(
                    typeof errors?.body === 'string' ? errors.body : 'Quote failed — rolled back.',
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
                        maxLength={maxBodyLength}
                        placeholder="Add a take…"
                        className="mf-field"
                    />
                    {errors.body ? <p className="mf-field-error">{errors.body}</p> : null}
                    <div className="mt-2 flex gap-2">
                        <button type="submit" disabled={processing} className="mf-btn mf-btn--pitch !min-h-8 !px-3">
                            Quote
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mf-btn mf-btn--ghost !min-h-8 !px-3"
                        >
                            Cancel
                        </button>
                    </div>
                </>
            )}
        </Form>
    );
}
