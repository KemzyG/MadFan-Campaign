import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { socialApi } from '../../../lib/socialApi';
import { applyOptimisticProps, useSocialFlash } from '../optimistic';
import ReplyQuote from './ReplyQuote';

function IconAttach() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.85"
                d="M17.5 8.5 9.9 16.1a3 3 0 0 1-4.24-4.24l7.6-7.6a5 5 0 0 1 7.07 7.07l-7.6 7.6a1 1 0 0 1-1.42-1.41l7.24-7.25"
            />
        </svg>
    );
}

function IconClose() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
        </svg>
    );
}

export default function Composer({ channel, maxBodyLength, inbox, replyTo, onClearReply }) {
    const page = usePage();
    const user = page.props?.auth?.user;
    const { reportError } = useSocialFlash();
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const [body, setBody] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) {
            return;
        }

        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
    }, [body]);

    useEffect(() => {
        if (replyTo) {
            textareaRef.current?.focus();
        }
    }, [replyTo?.id]);

    // The preview is a blob: URL for the locally-picked file — revoke it
    // whenever it's replaced/cleared so it doesn't leak memory.
    useEffect(() => () => {
        if (attachmentPreview) {
            URL.revokeObjectURL(attachmentPreview);
        }
    }, [attachmentPreview]);

    function pickAttachment(event) {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        if (attachmentPreview) {
            URL.revokeObjectURL(attachmentPreview);
        }

        setAttachment(file);
        setAttachmentPreview(URL.createObjectURL(file));
    }

    function clearAttachment() {
        if (attachmentPreview) {
            URL.revokeObjectURL(attachmentPreview);
        }
        setAttachment(null);
        setAttachmentPreview(null);
    }

    async function submit(e) {
        e.preventDefault();
        const text = body.trim();
        if ((!text && !attachment) || channel?.is_read_only || processing || !channel?.id) {
            return;
        }

        const replyToId = replyTo?.id ?? null;
        const quoted = replyTo
            ? {
                id: replyTo.id,
                body: replyTo.body,
                author_name: replyTo.author?.name ?? null,
                type: replyTo.type,
            }
            : null;
        const tempId = `tmp-chat-${Date.now()}`;
        const pendingMedia = attachment
            ? {
                url: attachmentPreview,
                type: attachment.type.startsWith('video/') ? 'video' : 'image',
            }
            : null;
        const sentAttachment = attachment;

        setProcessing(true);
        setBody('');
        clearAttachment();
        onClearReply?.();

        const rollback = applyOptimisticProps((props) => {
            const items = props.messages?.items || [];
            return {
                messages: {
                    ...props.messages,
                    items: [
                        ...items,
                        {
                            id: tempId,
                            body: text || null,
                            media: pendingMedia,
                            type: pendingMedia ? 'attachment' : 'text',
                            created_at: new Date().toISOString(),
                            edited_at: null,
                            is_mine: true,
                            author: {
                                id: user?.id,
                                name: user?.name || 'You',
                                handle: user?.handle,
                                fan_id: user?.fan_id,
                                avatar_url: user?.avatar_url,
                                avatar_emoji: user?.avatar_emoji,
                            },
                            reply_to: quoted,
                            _optimistic: true,
                        },
                    ],
                },
            };
        });

        try {
            let payload;
            if (sentAttachment) {
                payload = new FormData();
                if (text) {
                    payload.append('body', text);
                }
                if (replyToId) {
                    payload.append('reply_to_message_id', replyToId);
                }
                payload.append('attachment', sentAttachment);
            } else {
                payload = { body: text, ...(replyToId ? { reply_to_message_id: replyToId } : {}) };
            }

            const data = await socialApi(`/chat/channels/${channel.id}/messages`, {
                method: 'POST',
                body: payload,
            });

            applyOptimisticProps((props) => {
                const items = props.messages?.items || [];
                const presented = data?.data;
                return {
                    messages: {
                        ...props.messages,
                        items: items.map((item) =>
                            item.id === tempId
                                ? { ...(presented || item), is_mine: true, _optimistic: false }
                                : item),
                    },
                };
            });
        } catch (error) {
            rollback();
            setBody(text);
            reportError?.(
                error instanceof Error && error.message
                    ? error.message
                    : 'Message failed — rolled back.',
            );
        } finally {
            setProcessing(false);
        }
    }

    const placeholder =
        inbox === 'friends'
            ? `Message ${channel?.name || 'friend'}`
            : inbox === 'groups'
                ? `Message ${channel?.name || 'group'}`
                : `Message #${channel?.name || 'general'}`;

    if (channel?.is_read_only) {
        return (
            <div className="mf-chat-composer">
                <p className="mf-chat-composer__closed mf-text-meta">
                    This channel is read-only.
                </p>
            </div>
        );
    }

    return (
        <form className="mf-chat-composer" onSubmit={submit}>
            {replyTo ? (
                <ReplyQuote
                    variant="composer"
                    authorName={replyTo.author?.name}
                    body={replyTo.body}
                    type={replyTo.type}
                    onDismiss={onClearReply}
                />
            ) : null}

            {attachmentPreview ? (
                <div className="mf-chat-composer__attachment">
                    {attachment?.type.startsWith('video/') ? (
                        <video src={attachmentPreview} muted />
                    ) : (
                        <img src={attachmentPreview} alt="" />
                    )}
                    <button
                        type="button"
                        className="mf-chat-composer__attachment-remove"
                        onClick={clearAttachment}
                        aria-label="Remove attachment"
                    >
                        <IconClose />
                    </button>
                </div>
            ) : null}

            <div className="mf-chat-composer__shell">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                    onChange={pickAttachment}
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    className="mf-chat-composer__attach"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                    aria-label="Attach a photo or video"
                    title="Attach a photo or video"
                >
                    <IconAttach />
                </button>
                <textarea
                    ref={textareaRef}
                    className="mf-chat-composer__input"
                    rows={1}
                    maxLength={maxBodyLength}
                    placeholder={placeholder}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape' && replyTo) {
                            e.preventDefault();
                            onClearReply?.();
                            return;
                        }
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submit(e);
                        }
                    }}
                    disabled={processing}
                    aria-label="Chat message"
                />
                <button
                    type="submit"
                    className="mf-chat-composer__send"
                    disabled={processing || (!body.trim() && !attachment)}
                    aria-label={processing ? 'Sending' : 'Send message'}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                </button>
            </div>
            <div className="mf-chat-composer__bar">
                <span className="mf-chat-composer__hint mf-text-meta text-[var(--mf-muted)]">
                    Enter to send · Shift+Enter for line
                </span>
                <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">
                    {body.length}/{maxBodyLength}
                </span>
            </div>
        </form>
    );
}
