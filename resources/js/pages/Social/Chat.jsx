import { Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getEcho, leaveEchoChannel } from '../../echo';
import SocialShell from '../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../lib/defaultImage';
import { socialApi } from '../../lib/socialApi';
import { ChatSkeleton } from './components/Skeletons';
import { applyOptimisticProps, useSocialFlash } from './optimistic';

const INBOXES = [
    { id: 'club', label: 'Club' },
    { id: 'friends', label: 'Friends' },
    { id: 'groups', label: 'Groups' },
];

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

function AuthorAvatar({ author, size = 'md' }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const sizeClass = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

    if (author?.avatar_url) {
        return (
            <img
                src={author.avatar_url}
                alt=""
                className={`mf-avatar ${sizeClass}`}
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }

    const label = (author?.name || author?.handle || '?').slice(0, 1).toUpperCase();

    return (
        <span className={`mf-avatar mf-text-meta ${sizeClass}`} aria-hidden>
            {author?.avatar_emoji || label}
        </span>
    );
}

function ChatMessageRow({ message, isGrouped, showAuthor }) {
    const author = message.author;
    const isMine = Boolean(message.is_mine);
    const side = isMine ? 'is-mine' : 'is-theirs';

    return (
        <article
            className={`mf-chat-bubble ${side} ${isGrouped ? 'is-grouped' : ''} ${message._optimistic ? 'is-optimistic' : ''}`}
        >
            {!isMine ? (
                <div className="mf-chat-bubble__gutter">
                    {isGrouped ? (
                        <span className="mf-chat-bubble__time-hover mf-text-micro text-[var(--mf-muted)]">
                            {formatTime(message.created_at)}
                        </span>
                    ) : (
                        <AuthorAvatar author={author} size="sm" />
                    )}
                </div>
            ) : null}

            <div className="mf-chat-bubble__stack">
                {showAuthor && !isMine && !isGrouped ? (
                    <span className="mf-chat-bubble__name">{author?.name || 'Fan'}</span>
                ) : null}
                <div className="mf-chat-bubble__pill">
                    <p className="mf-chat-bubble__text">{message.body}</p>
                    <div className="mf-chat-bubble__meta">
                        <time dateTime={message.created_at}>{formatTime(message.created_at)}</time>
                        {message._optimistic ? <span>sending…</span> : null}
                    </div>
                </div>
            </div>
        </article>
    );
}

function ChatComposer({ channel, maxBodyLength, inbox }) {
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
                            is_mine: true,
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
                            placeholder={placeholder}
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

function InboxTabs({ inbox }) {
    return (
        <div className="mf-chat-inboxes" role="tablist" aria-label="Chat inboxes">
            {INBOXES.map((item) => (
                <Link
                    key={item.id}
                    href={`/social/chat?inbox=${item.id}`}
                    className={inbox === item.id ? 'is-active' : ''}
                    preserveScroll
                    prefetch
                    role="tab"
                    aria-selected={inbox === item.id}
                >
                    {item.label}
                </Link>
            ))}
        </div>
    );
}

function StartFriendChat({ candidates }) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    function start(userId) {
        if (processing) {
            return;
        }
        setProcessing(true);
        router.post('/social/chat/direct', { user_id: userId }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    }

    if (!candidates?.length) {
        return null;
    }

    return (
        <div className="mf-chat-start">
            <button
                type="button"
                className="mf-chat-start__toggle"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
            >
                {open ? 'Hide fans' : 'New friend chat'}
            </button>
            {open ? (
                <ul className="mf-chat-start__list">
                    {candidates.map((fan) => (
                        <li key={fan.id}>
                            <button type="button" onClick={() => start(fan.id)} disabled={processing}>
                                <AuthorAvatar author={fan} size="sm" />
                                <span className="min-w-0">
                                    <span className="mf-chat-start__name">{fan.name}</span>
                                    {fan.handle ? (
                                        <span className="mf-text-meta text-[var(--mf-muted)]">@{fan.handle}</span>
                                    ) : null}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

function CreateGroupChat({ candidates }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [selected, setSelected] = useState([]);
    const [processing, setProcessing] = useState(false);

    function toggle(id) {
        setSelected((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    }

    function submit(e) {
        e.preventDefault();
        if (!name.trim() || selected.length === 0 || processing) {
            return;
        }

        setProcessing(true);
        router.post('/social/chat/groups', {
            name: name.trim(),
            member_ids: selected,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setOpen(false);
                setName('');
                setSelected([]);
            },
        });
    }

    return (
        <div className="mf-chat-start">
            <button
                type="button"
                className="mf-chat-start__toggle"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
            >
                {open ? 'Cancel group' : 'New group'}
            </button>
            {open ? (
                <form className="mf-chat-group-form" onSubmit={submit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Group name"
                        maxLength={60}
                        required
                    />
                    {candidates?.length ? (
                        <ul className="mf-chat-start__list">
                            {candidates.map((fan) => {
                                const checked = selected.includes(fan.id);
                                return (
                                    <li key={fan.id}>
                                        <button
                                            type="button"
                                            className={checked ? 'is-selected' : ''}
                                            onClick={() => toggle(fan.id)}
                                        >
                                            <AuthorAvatar author={fan} size="sm" />
                                            <span className="min-w-0">
                                                <span className="mf-chat-start__name">{fan.name}</span>
                                                {fan.handle ? (
                                                    <span className="mf-text-meta text-[var(--mf-muted)]">
                                                        @{fan.handle}
                                                    </span>
                                                ) : null}
                                            </span>
                                            <span className="mf-chat-start__check" aria-hidden>
                                                {checked ? '✓' : ''}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="mf-text-meta text-[var(--mf-muted)]">
                            Follow fans first to invite them into a group.
                        </p>
                    )}
                    <button
                        type="submit"
                        className="mf-chat-group-form__submit"
                        disabled={processing || !name.trim() || selected.length === 0}
                    >
                        {processing ? 'Creating…' : 'Create group'}
                    </button>
                </form>
            ) : null}
        </div>
    );
}

export default function Chat({
    inbox = 'club',
    club,
    channels = [],
    threads = [],
    friend_candidates = [],
    group_candidates = [],
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
    const showAuthorNames = inbox !== 'friends';

    const filteredChannels = useMemo(() => {
        const q = channelQuery.trim().toLowerCase();
        const source = inbox === 'club' ? channels : threads;
        if (!q) {
            return source;
        }

        return source.filter((ch) =>
            [ch.name, ch.slug, ch.topic].filter(Boolean).join(' ').toLowerCase().includes(q));
    }, [channels, threads, channelQuery, inbox]);

    usePoll(fallbackPollMs, {
        only: ['messages', 'channels', 'threads', 'channel', 'friend_candidates', 'group_candidates'],
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
                only: ['messages', 'threads'],
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

    const headerTitle =
        inbox === 'friends'
            ? channel?.name || 'Friends'
            : inbox === 'groups'
                ? channel?.name || 'Groups'
                : club?.name || 'Club radio';

    const headerCaption =
        inbox === 'friends'
            ? 'Friends chat'
            : inbox === 'groups'
                ? 'Group chat'
                : 'Club radio';

    const headerSub =
        inbox === 'club'
            ? `#${channel?.name || 'general'}${channel?.topic ? ` · ${channel.topic}` : ''}`
            : channel?.topic || (inbox === 'friends' ? 'Direct messages' : 'Private groups');

    const emptyCopy =
        inbox === 'friends'
            ? {
                title: 'No friend chats yet',
                body: 'Start a chat with someone you follow — messages land left and right like WhatsApp.',
            }
            : inbox === 'groups'
                ? {
                    title: 'No groups yet',
                    body: 'Create a group with fellow fans and keep the banter in one thread.',
                }
                : {
                    title: 'Quiet radio',
                    body: `Kick the first shout in #${channel?.name || 'general'}${club?.name ? ` for ${club.name}` : ''}.`,
                };

    return (
        <SocialShell title="Chat">
            <Head title={channel ? channel.name : 'Chat'} />

            {messages == null ? (
                <ChatSkeleton />
            ) : (
                <div className="mf-chat">
                    <header className="mf-chat-header">
                        <div className="mf-chat-header__main">
                            <div className="mf-chat-header__club">
                                {inbox === 'club' && club?.logo_url ? (
                                    <img
                                        src={club.logo_url}
                                        alt=""
                                        className="mf-avatar h-10 w-10"
                                        onError={(event) => onImageError(event, fallbackUrl)}
                                    />
                                ) : inbox === 'friends' && channel?.peer ? (
                                    <AuthorAvatar author={channel.peer} />
                                ) : (
                                    <span className="mf-avatar mf-text-meta h-10 w-10">
                                        {(headerTitle || '?').slice(0, 2).toUpperCase()}
                                    </span>
                                )}
                                <div className="min-w-0">
                                    <p className="mf-text-caption text-[var(--mf-pitch)]">{headerCaption}</p>
                                    <p className="mf-display mf-text-ui truncate tracking-[0.02em] text-[var(--mf-text)]">
                                        {headerTitle}
                                    </p>
                                    <p className="mf-text-meta truncate text-[var(--mf-muted)]">{headerSub}</p>
                                </div>
                            </div>
                        </div>
                        {realtime?.mode ? (
                            <span className="mf-chat-live mf-text-micro" title={realtime.note}>
                                <span className="mf-chat-live__dot" aria-hidden />
                                {realtime.mode === 'reverb' ? 'Live' : 'Polling'}
                            </span>
                        ) : null}
                    </header>

                    <InboxTabs inbox={inbox} />

                    <div className="mf-chat-rail">
                        <label className="mf-chat-search">
                            <span className="sr-only">
                                {inbox === 'club' ? 'Filter channels' : 'Filter chats'}
                            </span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                                <circle cx="11" cy="11" r="6.5" strokeWidth="1.75" />
                                <path strokeLinecap="round" strokeWidth="1.75" d="m16 16 3.5 3.5" />
                            </svg>
                            <input
                                type="search"
                                value={channelQuery}
                                onChange={(e) => setChannelQuery(e.target.value)}
                                placeholder={inbox === 'club' ? 'Find a channel' : 'Find a chat'}
                                autoComplete="off"
                            />
                        </label>

                        {inbox === 'friends' ? <StartFriendChat candidates={friend_candidates} /> : null}
                        {inbox === 'groups' ? <CreateGroupChat candidates={group_candidates} /> : null}

                        <div className="mf-chat-channels" role="tablist" aria-label={inbox === 'club' ? 'Channels' : 'Chats'}>
                            {filteredChannels.length === 0 ? (
                                <p className="mf-chat-channels__empty mf-text-meta text-[var(--mf-muted)]">
                                    {inbox === 'club' ? 'No channels match.' : 'No chats yet.'}
                                </p>
                            ) : (
                                filteredChannels.map((ch) => (
                                    <Link
                                        key={ch.id}
                                        href={ch.href || `/social/chat?inbox=${inbox}&channel=${encodeURIComponent(ch.slug || ch.id)}`}
                                        className={ch.is_active ? 'is-active' : ''}
                                        preserveScroll
                                        prefetch
                                        role="tab"
                                        aria-selected={ch.is_active}
                                    >
                                        {inbox === 'club' ? (
                                            <span className="mf-chat-channels__hash">#</span>
                                        ) : null}
                                        {ch.name}
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mf-chat-stream" ref={scrollerRef} onScroll={onScroll} role="log">
                        {!channel ? (
                            <div className="mf-empty mf-empty--compact mf-chat-empty">
                                <div className="mf-chat-empty__mark" aria-hidden>
                                    <span />
                                    <span />
                                </div>
                                <p className="mf-empty-title">{emptyCopy.title}</p>
                                <p>{emptyCopy.body}</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="mf-empty mf-empty--compact mf-chat-empty">
                                <div className="mf-chat-empty__mark" aria-hidden>
                                    <span />
                                    <span />
                                </div>
                                <p className="mf-empty-title">No messages yet</p>
                                <p>Say hello — your messages appear on the right.</p>
                            </div>
                        ) : (
                            items.map((message, index) => {
                                const prev = items[index - 1];
                                const showDay =
                                    !prev || dayKey(prev.created_at) !== dayKey(message.created_at);
                                const isGrouped =
                                    prev
                                    && prev.author?.id === message.author?.id
                                    && Boolean(prev.is_mine) === Boolean(message.is_mine)
                                    && dayKey(prev.created_at) === dayKey(message.created_at)
                                    && Math.abs(new Date(message.created_at) - new Date(prev.created_at)) < 5 * 60 * 1000;

                                return (
                                    <div key={message.id}>
                                        {showDay ? (
                                            <div className="mf-chat-day" role="separator">
                                                <span>{formatDayLabel(message.created_at)}</span>
                                            </div>
                                        ) : null}
                                        <ChatMessageRow
                                            message={message}
                                            isGrouped={Boolean(isGrouped)}
                                            showAuthor={showAuthorNames}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {channel ? (
                        <ChatComposer channel={channel} maxBodyLength={max_body_length} inbox={inbox} />
                    ) : null}
                </div>
            )}
        </SocialShell>
    );
}
