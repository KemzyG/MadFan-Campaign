import { Head, Link, router, useForm, usePage, usePoll } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { getEcho, leaveEchoChannel } from '../../echo';
import SocialShell from '../../Layouts/SocialShell';
import { ChatSkeleton } from './components/Skeletons';
import { useSocialFlash, withRollbackFlash } from './optimistic';

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

function AuthorAvatar({ author }) {
    if (author?.avatar_url) {
        return <img src={author.avatar_url} alt="" className="mf-avatar h-8 w-8" />;
    }

    const label = (author?.handle || author?.name || '?').slice(0, 2).toUpperCase();

    return (
        <span className="mf-avatar mf-text-meta h-8 w-8" aria-hidden>
            {author?.avatar_emoji || label}
        </span>
    );
}

function ChatMessageRow({ message, isGrouped }) {
    const author = message.author;
    const handle = author?.handle ? `@${author.handle}` : author?.fan_id || 'fan';

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
                        <span className="mf-mono mf-text-meta text-[var(--mf-muted)]">{handle}</span>
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
    const { reportError } = useSocialFlash();
    const { data, setData, processing, errors, reset, optimistic } = useForm({
        body: '',
    });

    function submit(e) {
        e.preventDefault();
        if (!data.body.trim() || channel?.is_read_only || processing || !channel?.id) {
            return;
        }

        const body = data.body.trim();
        const tempId = `tmp-chat-${Date.now()}`;

        optimistic((props) => {
            const items = props.messages?.items || [];
            return {
                messages: {
                    ...props.messages,
                    items: [
                        ...items,
                        {
                            id: tempId,
                            body,
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
        }).post(
            `/social/chat/channels/${channel.id}/messages`,
            withRollbackFlash(reportError, {
                preserveScroll: true,
                onSuccess: () => reset('body'),
                onError: () => setData('body', body),
            }, 'Message failed — rolled back.'),
        );
    }

    return (
        <form className="mf-chat-composer" onSubmit={submit}>
            {channel?.is_read_only ? (
                <p className="mf-text-meta text-[var(--mf-muted)]">This channel is read-only.</p>
            ) : (
                <>
                    <textarea
                        className="mf-chat-composer__input"
                        rows={1}
                        maxLength={maxBodyLength}
                        placeholder={`Message #${channel?.name || 'general'}`}
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                submit(e);
                            }
                        }}
                        disabled={processing}
                        aria-label="Chat message"
                    />
                    <div className="mf-chat-composer__bar">
                        <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">
                            {data.body.length}/{maxBodyLength}
                        </span>
                        <button type="submit" className="mf-btn mf-btn--pitch" disabled={processing || !data.body.trim()}>
                            {processing ? 'Sending…' : 'Send'}
                        </button>
                    </div>
                    {errors.body ? <p className="mf-field-error">{errors.body}</p> : null}
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
    const usingReverb = realtime?.mode === 'reverb';
    const fallbackPollMs = usingReverb ? Math.max(poll_ms, 30000) : poll_ms;

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
                <div className="mf-chat-header">
                    {club ? (
                        <div className="flex min-w-0 items-center gap-3">
                            {club.logo_url ? (
                                <img src={club.logo_url} alt="" className="mf-avatar h-9 w-9" />
                            ) : (
                                <span className="mf-avatar mf-text-meta h-9 w-9">
                                    {(club.short || club.name || '?').slice(0, 2)}
                                </span>
                            )}
                            <div className="min-w-0">
                                <p className="mf-text-ui truncate font-semibold text-[var(--mf-text)]">{club.name}</p>
                                <p className="mf-text-meta truncate text-[var(--mf-muted)]">
                                    #{channel?.name || 'general'}
                                    {channel?.topic ? ` · ${channel.topic}` : ''}
                                </p>
                            </div>
                        </div>
                    ) : null}
                    {realtime?.mode ? (
                        <span className="mf-chat-live mf-text-micro" title={realtime.note}>
                            {realtime.mode === 'reverb' ? 'Live · Reverb' : 'Live · poll'}
                        </span>
                    ) : null}
                </div>

                <div className="mf-chat-channels" role="tablist" aria-label="Channels">
                    {channels.map((ch) => (
                        <Link
                            key={ch.id}
                            href={`/social/chat?channel=${encodeURIComponent(ch.slug)}`}
                            className={ch.is_active ? 'is-active' : ''}
                            preserveScroll
                            prefetch
                            role="tab"
                            aria-selected={ch.is_active}
                        >
                            #{ch.name}
                        </Link>
                    ))}
                </div>

                <div className="mf-chat-stream" ref={scrollerRef} onScroll={onScroll}>
                    {items.length === 0 ? (
                        <div className="mf-empty mf-empty--compact">
                            <p className="mf-empty-title">Quiet radio</p>
                            <p>Kick the first shout in #{channel?.name || 'general'}.</p>
                        </div>
                    ) : (
                        items.map((message, index) => {
                            const prev = items[index - 1];
                            const isGrouped =
                                prev &&
                                prev.author?.id === message.author?.id &&
                                Math.abs(new Date(message.created_at) - new Date(prev.created_at)) < 5 * 60 * 1000;

                            return <ChatMessageRow key={message.id} message={message} isGrouped={Boolean(isGrouped)} />;
                        })
                    )}
                </div>

                <ChatComposer channel={channel} maxBodyLength={max_body_length} />
            </div>
            )}
        </SocialShell>
    );
}
