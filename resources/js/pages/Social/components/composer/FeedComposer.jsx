import { useEffect, useId, useRef, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../../lib/defaultImage';
import { prependFeedPost, useSocialFlash, withRollbackFlash } from '../../optimistic';
import { IconImage } from '../post/icons';
import PostSettingsBar from './PostSettingsBar';
import TaggedChips from './TaggedChips';
import TagFriendsPicker from './TagFriendsPicker';

const MAX_TAGGED = 10;

/**
 * The primary "write a post" composer. Rendered inline on the feed and inside
 * the compose sheet (`variant="sheet"`). Carries the post's audience
 * (visibility), who-can-reply scope, and tagged friends.
 */
export default function FeedComposer({
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
    const fallbackUrl = resolveDefaultImageUrl(page.props);
    const inputId = useId();
    const { reportError } = useSocialFlash();
    const textareaRef = useRef(null);

    const { data, setData, errors } = useForm({
        body: '',
        images: [],
    });

    const [visibility, setVisibility] = useState('public');
    const [replyScope, setReplyScope] = useState('everyone');
    const [tagged, setTagged] = useState([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [previews, setPreviews] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const next = (data.images || []).map((file, index) => ({
            id: `${file.name}-${index}-${file.size}`,
            url: URL.createObjectURL(file),
            name: file.name,
            isVideo: file.type?.startsWith('video/'),
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

    function insertEmoji(emoji) {
        const el = textareaRef.current;

        if (!el) {
            setData('body', (data.body + emoji).slice(0, maxBodyLength));
            return;
        }

        const start = el.selectionStart ?? data.body.length;
        const end = el.selectionEnd ?? data.body.length;
        const next = (data.body.slice(0, start) + emoji + data.body.slice(end)).slice(0, maxBodyLength);
        setData('body', next);

        requestAnimationFrame(() => {
            el.focus();
            const caret = Math.min(start + emoji.length, next.length);
            el.setSelectionRange(caret, caret);
        });
    }

    function submit(event) {
        event.preventDefault();
        if (!canPost || busy) {
            return;
        }

        const body = data.body.trim();
        const images = [...(data.images || [])];
        const taggedUsers = [...tagged];
        const tempId = `tmp-post-${Date.now()}`;
        const hasImages = images.length > 0;

        setSubmitting(true);

        router
            .optimistic((props) =>
                prependFeedPost(props, {
                    id: tempId,
                    body: body || (hasImages ? 'Uploading media…' : null),
                    type: 'post',
                    visibility,
                    reply_scope: replyScope,
                    likes_count: 0,
                    replies_count: 0,
                    reposts_count: 0,
                    quotes_count: 0,
                    views_count: 0,
                    liked_by_viewer: false,
                    bookmarked_by_viewer: false,
                    hidden_by_viewer: false,
                    viewer_follows_author: false,
                    viewer_can_reply: true,
                    is_own: true,
                    published_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    author: {
                        id: user?.id,
                        name: user?.name || 'You',
                        handle: user?.handle || user?.fan_id,
                        avatar_url: user?.avatar_url,
                    },
                    club: null,
                    media: [],
                    stage: null,
                    tagged: taggedUsers.map((entry) => ({
                        id: entry.id,
                        name: entry.name,
                        handle: entry.handle,
                        avatar_url: entry.avatar_url,
                    })),
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
                {
                    body,
                    images,
                    visibility,
                    reply_scope: replyScope,
                    tagged: taggedUsers.map((entry) => entry.id),
                },
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
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt=""
                            onError={(event) => onImageError(event, fallbackUrl)}
                        />
                    ) : (
                        initial
                    )}
                </div>
                <div className="mf-composer__main">
                    <label className="sr-only" htmlFor={inputId}>
                        Compose post
                    </label>
                    <textarea
                        id={inputId}
                        ref={textareaRef}
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
                                    {preview.isVideo ? (
                                        <video src={preview.url} muted playsInline preload="metadata" />
                                    ) : (
                                        <img src={preview.url} alt="" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : null}

                    <TaggedChips
                        tagged={tagged}
                        onRemove={(id) => setTagged((prev) => prev.filter((entry) => entry.id !== id))}
                    />

                    {errors.body ? <p className="mf-field-error">{errors.body}</p> : null}
                    {errors.images ? <p className="mf-field-error">{errors.images}</p> : null}

                    <PostSettingsBar
                        visibility={visibility}
                        onVisibilityChange={setVisibility}
                        replyScope={replyScope}
                        onReplyScopeChange={setReplyScope}
                        onTagClick={() => setPickerOpen(true)}
                        taggedCount={tagged.length}
                        onEmoji={insertEmoji}
                        disabled={busy}
                    />

                    <div className="mf-composer__bar">
                        <div className="mf-composer__tools">
                            <label className="mf-composer-attach">
                                <IconImage />
                                <span>Media</span>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
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
                        <button type="submit" disabled={busy || !canPost} className="mf-btn mf-btn--pitch">
                            {busy ? 'Posting…' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>

            <TagFriendsPicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                selected={tagged}
                onChange={setTagged}
                max={MAX_TAGGED}
            />
        </form>
    );
}
