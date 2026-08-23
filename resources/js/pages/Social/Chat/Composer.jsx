import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { socialApi } from '../../../lib/socialApi';
import { applyOptimisticProps, useSocialFlash } from '../optimistic';
import ReplyQuote from './ReplyQuote';

export default function Composer({ channel, maxBodyLength, inbox, replyTo, onClearReply }) {
    const page = usePage();
    const user = page.props?.auth?.user;
    const { reportError, reportSuccess } = useSocialFlash();
    const textareaRef = useRef(null);
    const [body, setBody] = useState('');
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

    async function submit(e) {
        e.preventDefault();
        if (!body.trim() || channel?.is_read_only || processing || !channel?.id) {
            return;
        }

        const text = body.trim();
        const replyToId = replyTo?.id ?? null;
        const quoted = replyTo
            ? {
                id: replyTo.id,
                body: replyTo.body,
                author_name: replyTo.author?.name ?? null,
            }
            : null;
        const tempId = `tmp-chat-${Date.now()}`;

        setProcessing(true);
        setBody('');
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
                            body: text,
                            type: 'text',
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
            const data = await socialApi(`/chat/channels/${channel.id}/messages`, {
                method: 'POST',
                body: {
                    body: text,
                    ...(replyToId ? { reply_to_message_id: replyToId } : {}),
                },
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

            reportSuccess?.(data?.message || 'Message sent.');
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
                    onDismiss={onClearReply}
                />
            ) : null}

            <div className="mf-chat-composer__shell">
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
                    disabled={processing || !body.trim()}
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
