import { Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getEcho, leaveEchoChannel } from '../../echo';
import SocialShell from '../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../lib/defaultImage';
import { socialApi } from '../../lib/socialApi';
import { ChatSkeleton } from './components/Skeletons';
import { applyOptimisticProps, useSocialFlash } from './optimistic';

function formatTime(iso) {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return '';
    }
}

function formatDayLabel(iso) {
    if (!iso) {
        return '';
    }

    try {
        const date = new Date(iso);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const sameDay = (a, b) =>
            a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();

        if (sameDay(date, today)) {
            return 'Today';
        }
        if (sameDay(date, yesterday)) {
            return 'Yesterday';
        }

        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        }).format(date);
    } catch {
        return '';
    }
}

function dayKey(iso) {
    if (!iso) {
        return '';
    }

    try {
        const d = new Date(iso);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    } catch {
        return '';
    }
}

function AuthorAvatar({ author }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    if (author?.avatar_url) {
        return (
            <img
                src={author.avatar_url}
                alt=""
                className="mf-avatar h-9 w-9"
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }

    const label = (author?.name || author?.handle || '?').slice(0, 1).toUpperCase();

    return (
        <span className="mf-avatar mf-text-meta h-9 w-9" aria-hidden>
            {author?.avatar_emoji || label}
        </span>
    );
}

function ChatMessageRow({ message, isGrouped }) {
    const author = message.author;

    return (
        <article
            className={`mf-chat-msg ${isGrouped ? 'is-grouped' : ''} ${message._optimistic ? 'is-optimistic' : ''}`}
        >
            <div className="mf-chat-msg__gutter">
                {isGrouped ? (
                    <span className="mf-chat-msg__time-hover mf-text-micro text-[var(--mf-muted)]">
                        {formatTime(message.created_at)}
                    </span>
                ) : (
                    <AuthorAvatar author={author} />
                )}
            </div>
            <div className="mf-chat-msg__body">
                {!isGrouped ? (
                    <div className="mf-chat-msg__meta">
                        <span className="mf-chat-msg__name">{author?.name || 'Fan'}</span>
                        <time className="mf-text-meta text-[var(--mf-muted)]" dateTime={message.created_at}>
                            {formatTime(message.created_at)}
                        </time>
                        {message._optimistic ? (
                            <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">sending…</span>
                        ) : null}
                    </div>
                ) : null}
                <p className="mf-chat-msg__text">{message.body}</p>
            </div>
        </article>
    );
}

function ChatComposer({ channel, maxBodyLength }) {
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

    async function submit(e) {
        e.preventDefault();
        if (!body.trim() || channel?.is_read_only || processing || !channel?.id) {
            return;
        }

        const text = body.trim();
        const tempId = `tmp-chat-${Date.now()}`;
        setProcessing(true);
        setBody('');

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
                            author: {
                                id: user?.id,
                                name: user?.name || 'You',
                                handle: user?.handle,
                                fan_id: user?.fan_id,
                                avatar_url: user?.avatar_url,
                                avatar_emoji: user?.avatar_emoji,
                            },
                            _optimistic: true,
                        },
                    ],
                },
            };
        });

        try {
            const data = await socialApi(`/chat/channels/${channel.id}/messages`, {
                method: 'POST',
                body: { body: text },
            });

            applyOptimisticProps((props) => {
                const items = props.messages?.items || [];
                const presented = data?.data;
                return {
                    messages: {
                        ...props.messages,
                        items: items.map((item) =>
                            item.id === tempId
                                ? { ...(presented || item), _optimistic: false }
                                : item,
                        ),
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

    return (
        <form className="mf-chat-composer" onSubmit={submit}>
            {channel?.is_read_only ? (
                <p className="mf-text-meta text-[var(--mf-muted)]">This channel is read-only.</p>
            ) : (
                <>
                    <div className="mf-chat-composer__shell">
                        <textarea
                            ref={textareaRef}
                            className="mf-chat-composer__input"
                            rows={1}
                            maxLength={maxBodyLength}
                            placeholder={`Message #${channel?.name || 'general'}`}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            onKeyDown={(e) => {
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
                        <span className="mf-text-meta text-[var(--mf-muted)]">
                            Enter to send · Shift+Enter for line
                        </span>
                        <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">
                            {body.length}/{maxBodyLength}
                        </span>
                    </div>
                </>
            )}
        </form>
    );
}

export default function Chat({
    club,
    channels = [],
    channel,
    messages,
    max_body_length = 500,
    poll_ms = 4000,
    realtime,
}) {
    const items = messages?.items || [];
    const scrollerRef = useRef(null);
    const wasNearBottom = useRef(true);
    const [channelQuery, setChannelQuery] = useState('');
    const usingReverb = realtime?.mode === 'reverb';
    const fallbackPollMs = usingReverb ? Math.max(poll_ms, 30000) : poll_ms;
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    const filteredChannels = useMemo(() => {
        const q = channelQuery.trim().toLowerCase();
        if (!q) {
            return channels;
        }

        return channels.filter((ch) =>
            [ch.name, ch.slug, ch.topic].filter(Boolean).join(' ').toLowerCase().includes(q));
    }, [channels, channelQuery]);

    usePoll(fallbackPollMs, {
        only: ['messages', 'channels', 'channel'],
        preserveScroll: true,
    });

    useEffect(() => {
        if (!usingReverb || !channel?.id) {
            return undefined;
        }

        const echo = getEcho();
        if (!echo) {
            return undefined;
        }

        const name = `social.chat.${channel.id}`;
        const subscription = echo.private(name).listen('.message.created', () => {
            router.reload({
                only: ['messages'],
                preserveScroll: true,
                preserveState: true,
            });
        });

        return () => {
            subscription.stopListening('.message.created');
            leaveEchoChannel(name);
        };
    }, [usingReverb, channel?.id]);

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el || !wasNearBottom.current) {
            return;
        }

        el.scrollTop = el.scrollHeight;
    }, [items.length, items[items.length - 1]?.id]);

    function onScroll() {
        const el = scrollerRef.current;
        if (!el) {
            return;
        }

        const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
        wasNearBottom.current = distance < 80;
    }

    return (
        <SocialShell title="Chat">
            <Head title={channel ? `#${channel.name}` : 'Chat'} />

            {messages == null ? (
                <ChatSkeleton />
            ) : (
                <div className="mf-chat">
                    <header className="mf-chat-header">
                        <div className="mf-chat-header__main">
                            {club ? (
                                <div className="mf-chat-header__club">
                                    {club.logo_url ? (
                                        <img
                                            src={club.logo_url}
                                            alt=""
                                            className="mf-avatar h-10 w-10"
                                            onError={(event) => onImageError(event, fallbackUrl)}
                                        />
                                    ) : (
                                        <span className="mf-avatar mf-text-meta h-10 w-10">
                                            {(club.short || club.name || '?').slice(0, 2)}
                                        </span>
                                    )}
                                    <div className="min-w-0">
                                        <p className="mf-text-caption text-[var(--mf-pitch)]">Club radio</p>
                                        <p className="mf-display mf-text-ui truncate tracking-[0.02em] text-[var(--mf-text)]">
                                            {club.name}
                                        </p>
                                        <p className="mf-text-meta truncate text-[var(--mf-muted)]">
                                            #{channel?.name || 'general'}
                                            {channel?.topic ? ` · ${channel.topic}` : ''}
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        {realtime?.mode ? (
                            <span className="mf-chat-live mf-text-micro" title={realtime.note}>
                                <span className="mf-chat-live__dot" aria-hidden />
                                {realtime.mode === 'reverb' ? 'Live' : 'Polling'}
                            </span>
                        ) : null}
                    </header>

                    <div className="mf-chat-rail">
                        <label className="mf-chat-search">
                            <span className="sr-only">Filter channels</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                                <circle cx="11" cy="11" r="6.5" strokeWidth="1.75" />
                                <path strokeLinecap="round" strokeWidth="1.75" d="m16 16 3.5 3.5" />
                            </svg>
                            <input
                                type="search"
                                value={channelQuery}
                                onChange={(e) => setChannelQuery(e.target.value)}
                                placeholder="Find a channel"
                                autoComplete="off"
                            />
                        </label>

                        <div className="mf-chat-channels" role="tablist" aria-label="Channels">
                            {filteredChannels.length === 0 ? (
                                <p className="mf-chat-channels__empty mf-text-meta text-[var(--mf-muted)]">
                                    No channels match.
                                </p>
                            ) : (
                                filteredChannels.map((ch) => (
                                    <Link
                                        key={ch.id}
                                        href={`/social/chat?channel=${encodeURIComponent(ch.slug)}`}
                                        className={ch.is_active ? 'is-active' : ''}
                                        preserveScroll
                                        prefetch
                                        role="tab"
                                        aria-selected={ch.is_active}
                                    >
                                        <span className="mf-chat-channels__hash">#</span>
                                        {ch.name}
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mf-chat-stream" ref={scrollerRef} onScroll={onScroll}>
                        {items.length === 0 ? (
                            <div className="mf-empty mf-empty--compact mf-chat-empty">
                                <div className="mf-chat-empty__mark" aria-hidden>
                                    <span />
                                    <span />
                                </div>
                                <p className="mf-empty-title">Quiet radio</p>
                                <p>
                                    Kick the first shout in #{channel?.name || 'general'}
                                    {club?.name ? ` for ${club.name}` : ''}.
                                </p>
                            </div>
                        ) : (
                            items.map((message, index) => {
                                const prev = items[index - 1];
                                const showDay =
                                    !prev || dayKey(prev.created_at) !== dayKey(message.created_at);
                                const isGrouped =
                                    prev
                                    && prev.author?.id === message.author?.id
                                    && dayKey(prev.created_at) === dayKey(message.created_at)
                                    && Math.abs(new Date(message.created_at) - new Date(prev.created_at)) < 5 * 60 * 1000;

                                return (
                                    <div key={message.id}>
                                        {showDay ? (
                                            <div className="mf-chat-day" role="separator">
                                                <span>{formatDayLabel(message.created_at)}</span>
                                            </div>
                                        ) : null}
                                        <ChatMessageRow message={message} isGrouped={Boolean(isGrouped)} />
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <ChatComposer channel={channel} maxBodyLength={max_body_length} />
                </div>
            )}
        </SocialShell>
    );
}
