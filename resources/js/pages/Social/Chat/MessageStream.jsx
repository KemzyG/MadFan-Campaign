import { useEffect, useRef, useState } from 'react';
import MediaLightbox from '../components/post/MediaLightbox';
import { linkifyText } from '../../../lib/linkify';
import { socialApi } from '../../../lib/socialApi';
import { applyOptimisticProps, useSocialFlash } from '../optimistic';
import MessageActionSheet from './MessageActionSheet';
import { prependChatMessages } from './chatRealtime';
import {
    AuthorAvatar,
    dayKey,
    formatDayLabel,
    formatTime,
    isGroupedWith,
    isVoiceMessage,
    jumpToMessage,
} from './helpers';
import ReplyQuote from './ReplyQuote';
import VoiceNotePlayer from './VoiceNotePlayer';

const LONG_PRESS_MS = 420;

function ReplyIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M10 9V5l-6 6 6 6v-4h4a5 5 0 0 1 5 5v1" />
        </svg>
    );
}

function MoreIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
        </svg>
    );
}

function MessageMedia({ message, onOpenLightbox }) {
    if (!message.media?.url || message.deleted) {
        return null;
    }

    if (isVoiceMessage(message)) {
        return (
            <div className="mf-chat-bubble__voice">
                <VoiceNotePlayer
                    src={message.media.url}
                    seed={message.id}
                    isMine={Boolean(message.is_mine)}
                    durationMs={message.media.duration_ms || 0}
                    compact
                    inBubble
                />
            </div>
        );
    }

    if (message.media.type === 'video') {
        return (
            <button type="button" className="mf-chat-bubble__media-btn" onClick={() => onOpenLightbox(message)}>
                <video src={message.media.url} muted playsInline />
                <span className="mf-chat-bubble__media-play" aria-hidden>▶</span>
            </button>
        );
    }

    return (
        <button type="button" className="mf-chat-bubble__media-btn" onClick={() => onOpenLightbox(message)}>
            <img src={message.media.url} alt="" loading="lazy" />
        </button>
    );
}

function MessageRow({
    message,
    isGrouped,
    showAuthor,
    inbox,
    onReply,
    onJump,
    onEdit,
    onOpenLightbox,
}) {
    const author = message.author;
    const isMine = Boolean(message.is_mine);
    const pressTimer = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editBody, setEditBody] = useState(message.body || '');
    const { reportError, reportSuccess } = useSocialFlash();
    const canInteract = !message._optimistic && !message.deleted;

    function clearPress() {
        if (pressTimer.current) {
            window.clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    }

    useEffect(() => clearPress, []);

    function startPress() {
        if (!canInteract) {
            return;
        }

        clearPress();
        pressTimer.current = window.setTimeout(() => {
            pressTimer.current = null;
            onReply(message);
        }, LONG_PRESS_MS);
    }

    async function saveEdit() {
        const next = editBody.trim();
        if (!next) {
            return;
        }

        try {
            const data = await socialApi(`/chat/messages/${message.id}`, {
                method: 'PATCH',
                body: { body: next },
            });

            applyOptimisticProps((props) => ({
                messages: {
                    ...props.messages,
                    items: (props.messages?.items || []).map((item) =>
                        item.id === message.id ? { ...item, ...(data?.data || {}), _optimistic: false } : item),
                },
            }));

            setEditing(false);
            onEdit?.(null);
            reportSuccess?.('Message updated.');
        } catch (error) {
            reportError?.(error instanceof Error ? error.message : 'Could not update message.');
        }
    }

    useEffect(() => {
        if (onEdit && editing) {
            onEdit(message);
        }
    }, [editing, message, onEdit]);

    const className = [
        'mf-chat-bubble',
        isMine ? 'is-mine' : 'is-theirs',
        isGrouped ? 'is-grouped' : '',
        message._optimistic ? 'is-optimistic' : '',
        message.deleted ? 'is-deleted' : '',
        isVoiceMessage(message) && !message.body ? 'is-voice-only' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <article
            id={`mf-msg-${message.id}`}
            className={className}
            onPointerDown={startPress}
            onPointerUp={clearPress}
            onPointerCancel={clearPress}
            onPointerMove={clearPress}
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
                <div className={`mf-chat-bubble__pill ${isVoiceMessage(message) && !message.body ? 'mf-chat-bubble__pill--voice' : ''}`}>
                    {message.reply_to ? (
                        <ReplyQuote
                            authorName={message.reply_to.author_name}
                            body={message.reply_to.body}
                            type={message.reply_to.type}
                            onJump={() => onJump?.(message.reply_to.id)}
                        />
                    ) : null}

                    {message.deleted ? (
                        <p className="mf-chat-bubble__deleted mf-text-meta">Message deleted</p>
                    ) : (
                        <>
                            <MessageMedia message={message} onOpenLightbox={onOpenLightbox} />
                            {editing ? (
                                <div className="mf-chat-bubble__edit">
                                    <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={2} />
                                    <div className="mf-chat-bubble__edit-actions">
                                        <button type="button" onClick={() => setEditing(false)}>Cancel</button>
                                        <button type="button" onClick={saveEdit}>Save</button>
                                    </div>
                                </div>
                            ) : message.body ? (
                                <p className="mf-chat-bubble__text">{linkifyText(message.body)}</p>
                            ) : null}
                        </>
                    )}

                    <div className="mf-chat-bubble__meta">
                        <time dateTime={message.created_at}>{formatTime(message.created_at)}</time>
                        {message.edited_at ? <span>edited</span> : null}
                        {message._optimistic ? <span>sending…</span> : null}
                    </div>
                </div>
            </div>

            {canInteract ? (
                <div className="mf-chat-bubble__actions">
                    <button
                        type="button"
                        className="mf-chat-bubble__reply"
                        onClick={() => onReply(message)}
                        aria-label={`Reply to ${author?.name || 'this message'}`}
                        title="Reply"
                    >
                        <ReplyIcon />
                    </button>
                    <button
                        type="button"
                        className="mf-chat-bubble__more"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Message actions"
                        title="Actions"
                    >
                        <MoreIcon />
                    </button>
                </div>
            ) : null}

            {menuOpen ? (
                <MessageActionSheet
                    message={message}
                    inbox={inbox}
                    onEdit={() => {
                        setEditBody(message.body || '');
                        setEditing(true);
                    }}
                    onReply={onReply}
                    onClose={() => setMenuOpen(false)}
                />
            ) : null}
        </article>
    );
}

export default function MessageStream({
    items = [],
    channel,
    inbox = 'friends',
    hasMore = false,
    oldestId = null,
    showAuthorNames = true,
    onReply,
    scrollerRef,
    emptyCopy,
}) {
    const { reportError } = useSocialFlash();
    const wasNearBottom = useRef(true);
    const loadingOlderRef = useRef(false);
    const [lightbox, setLightbox] = useState(null);
    const lastId = items[items.length - 1]?.id;

    useEffect(() => {
        const el = scrollerRef?.current;
        if (!el || !wasNearBottom.current) {
            return;
        }

        el.scrollTop = el.scrollHeight;
    }, [items.length, lastId, scrollerRef]);

    useEffect(() => {
        wasNearBottom.current = true;
        const el = scrollerRef?.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [channel?.id, scrollerRef]);

    async function loadOlder() {
        if (!channel?.id || !hasMore || !oldestId || loadingOlderRef.current) {
            return;
        }

        loadingOlderRef.current = true;
        const el = scrollerRef?.current;
        const previousHeight = el?.scrollHeight ?? 0;

        try {
            const data = await socialApi(
                `/chat/channels/${channel.id}/messages?before_id=${oldestId}&limit=50`,
            );
            const older = data?.data || [];

            applyOptimisticProps((props) => ({
                messages: {
                    ...props.messages,
                    items: prependChatMessages(props.messages?.items || [], older),
                    has_more: Boolean(data?.meta?.has_more),
                    oldest_id: data?.meta?.oldest_id ?? props.messages?.oldest_id,
                },
            }));

            requestAnimationFrame(() => {
                if (el) {
                    el.scrollTop = el.scrollHeight - previousHeight;
                }
            });
        } catch (error) {
            reportError?.(error instanceof Error ? error.message : 'Could not load older messages.');
        } finally {
            loadingOlderRef.current = false;
        }
    }

    function onScroll() {
        const el = scrollerRef?.current;
        if (!el) {
            return;
        }

        wasNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;

        if (el.scrollTop < 48) {
            loadOlder();
        }
    }

    function onJump(id) {
        if (!jumpToMessage(id)) {
            reportError?.('That message is further back — scroll up to load history.');
        }
    }

    function openLightbox(message) {
        if (!message.media?.url) {
            return;
        }

        setLightbox({
            media: [{ id: message.id, url: message.media.url, type: message.media.type }],
            index: 0,
        });
    }

    return (
        <>
            <div className="mf-chat-stream" ref={scrollerRef} onScroll={onScroll} role="log">
                {hasMore ? (
                    <div className="mf-chat-stream__history">
                        <button type="button" className="mf-chat-stream__history-btn" onClick={loadOlder}>
                            Load older messages
                        </button>
                    </div>
                ) : null}

                {items.length === 0 ? (
                    <div className="mf-empty mf-empty--compact mf-chat-empty">
                        <div className="mf-chat-empty__mark" aria-hidden>
                            <span />
                            <span />
                        </div>
                        <p className="mf-empty-title">{emptyCopy?.title || 'No messages yet'}</p>
                        <p>{emptyCopy?.body || 'Say hello — your messages appear on the right.'}</p>
                    </div>
                ) : (
                    items.map((message, index) => {
                        const previous = items[index - 1];
                        const showDay =
                            !previous || dayKey(previous.created_at) !== dayKey(message.created_at);

                        return (
                            <div key={message.id}>
                                {showDay ? (
                                    <div className="mf-chat-day" role="separator">
                                        <span>{formatDayLabel(message.created_at)}</span>
                                    </div>
                                ) : null}
                                <MessageRow
                                    message={message}
                                    isGrouped={!showDay && isGroupedWith(previous, message)}
                                    showAuthor={showAuthorNames}
                                    inbox={inbox}
                                    onReply={onReply}
                                    onJump={onJump}
                                    onOpenLightbox={openLightbox}
                                />
                            </div>
                        );
                    })
                )}
            </div>

            {lightbox ? (
                <MediaLightbox
                    media={lightbox.media}
                    index={lightbox.index}
                    onClose={() => setLightbox(null)}
                    onIndexChange={() => {}}
                />
            ) : null}
        </>
    );
}
