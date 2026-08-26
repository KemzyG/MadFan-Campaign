import { useEffect, useRef } from 'react';
import { linkifyText } from '../../../lib/linkify';
import { useSocialFlash } from '../optimistic';
import {
    AuthorAvatar,
    dayKey,
    formatDayLabel,
    formatTime,
    isGroupedWith,
    jumpToMessage,
} from './helpers';
import ReplyQuote from './ReplyQuote';

const LONG_PRESS_MS = 420;

function ReplyIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.9"
                d="M10 9V5l-6 6 6 6v-4h4a5 5 0 0 1 5 5v1"
            />
        </svg>
    );
}

function MessageRow({ message, isGrouped, showAuthor, onReply, onJump }) {
    const author = message.author;
    const isMine = Boolean(message.is_mine);
    const pressTimer = useRef(null);
    const canReply = typeof onReply === 'function' && !message._optimistic;

    function clearPress() {
        if (pressTimer.current) {
            window.clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    }

    useEffect(() => clearPress, []);

    function startPress() {
        if (!canReply) {
            return;
        }

        clearPress();
        pressTimer.current = window.setTimeout(() => {
            pressTimer.current = null;
            onReply(message);
        }, LONG_PRESS_MS);
    }

    const className = [
        'mf-chat-bubble',
        isMine ? 'is-mine' : 'is-theirs',
        isGrouped ? 'is-grouped' : '',
        message._optimistic ? 'is-optimistic' : '',
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
                <div className="mf-chat-bubble__pill">
                    {message.reply_to ? (
                        <ReplyQuote
                            authorName={message.reply_to.author_name}
                            body={message.reply_to.body}
                            onJump={() => onJump?.(message.reply_to.id)}
                        />
                    ) : null}
                    {message.media ? (
                        <div className="mf-chat-bubble__media">
                            {message.media.type === 'video' ? (
                                <video src={message.media.url} controls playsInline />
                            ) : (
                                <img src={message.media.url} alt="" loading="lazy" />
                            )}
                        </div>
                    ) : null}
                    {message.body ? (
                        <p className="mf-chat-bubble__text">{linkifyText(message.body)}</p>
                    ) : null}
                    <div className="mf-chat-bubble__meta">
                        <time dateTime={message.created_at}>{formatTime(message.created_at)}</time>
                        {message._optimistic ? <span>sending…</span> : null}
                    </div>
                </div>
            </div>

            {canReply ? (
                <button
                    type="button"
                    className="mf-chat-bubble__reply"
                    onClick={() => onReply(message)}
                    aria-label={`Reply to ${author?.name || 'this message'}`}
                    title="Reply"
                >
                    <ReplyIcon />
                </button>
            ) : null}
        </article>
    );
}

export default function MessageStream({
    items = [],
    channel,
    showAuthorNames = true,
    onReply,
    scrollerRef,
    emptyCopy,
}) {
    const { reportError } = useSocialFlash();
    const wasNearBottom = useRef(true);
    const lastId = items[items.length - 1]?.id;

    useEffect(() => {
        const el = scrollerRef?.current;
        if (!el || !wasNearBottom.current) {
            return;
        }

        el.scrollTop = el.scrollHeight;
    }, [items.length, lastId, scrollerRef]);

    // A channel switch always lands at the newest message.
    useEffect(() => {
        wasNearBottom.current = true;
        const el = scrollerRef?.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [channel?.id, scrollerRef]);

    function onScroll() {
        const el = scrollerRef?.current;
        if (!el) {
            return;
        }

        wasNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    }

    function onJump(id) {
        if (!jumpToMessage(id)) {
            reportError?.('That message is further back than this window.');
        }
    }

    return (
        <div className="mf-chat-stream" ref={scrollerRef} onScroll={onScroll} role="log">
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
                                onReply={onReply}
                                onJump={onJump}
                            />
                        </div>
                    );
                })
            )}
        </div>
    );
}
