import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { socialApi } from '../lib/socialApi';
import { AuthorAvatar, formatListStamp, PresenceDot } from '../pages/Social/Chat/helpers';

const DESKTOP_QUERY = '(min-width: 1024px)';
const STALE_MS = 45000;

/**
 * The shell remounts on every Inertia visit, so the last payload is cached at
 * module scope: the rail paints instantly and revalidates in the background.
 */
const cache = { rows: null, at: 0, inflight: null };

function loadRail() {
    const fresh = cache.rows !== null && Date.now() - cache.at < STALE_MS;
    if (fresh) {
        return Promise.resolve(cache.rows);
    }

    cache.inflight ??= socialApi('/chat/rail')
        .then((payload) => {
            cache.rows = Array.isArray(payload?.data) ? payload.data : [];
            cache.at = Date.now();

            return cache.rows;
        })
        .catch(() => null)
        .finally(() => {
            cache.inflight = null;
        });

    return cache.inflight;
}

function isChannelScope(scope) {
    return scope === 'fandom' || scope === 'club';
}

function previewText(row) {
    if (!row.last_message?.body) {
        return isChannelScope(row.scope) ? row.topic || 'No shouts yet' : 'No messages yet';
    }

    return `${row.last_message.is_mine ? 'You: ' : ''}${row.last_message.body}`;
}

function RailRow({ row }) {
    return (
        <Link href={row.href} className="mf-convo-row mf-convo-row--rail" prefetch>
            <span className="mf-convo-row__avatar">
                {isChannelScope(row.scope) ? (
                    <span className="mf-convo-row__hash mf-mono" aria-hidden>#</span>
                ) : row.scope === 'direct' && row.peer ? (
                    <AuthorAvatar author={row.peer} />
                ) : (
                    <span className="mf-avatar mf-text-meta h-9 w-9" aria-hidden>
                        {(row.name || '?').slice(0, 2).toUpperCase()}
                    </span>
                )}
                {row.scope === 'direct' && row.peer?.is_online ? (
                    <PresenceDot online className="mf-presence-dot--pin" />
                ) : null}
            </span>

            <span className="mf-convo-row__body">
                <span className="mf-convo-row__top">
                    <span className="mf-convo-row__name">{row.name}</span>
                    <span className="mf-convo-row__topmeta">
                        {row.scope !== 'direct' && row.online_count > 0 ? (
                            <span className="mf-convo-row__online mf-text-micro">
                                <PresenceDot online />
                                {row.online_count}
                            </span>
                        ) : null}
                        <span className="mf-convo-row__stamp mf-mono">
                            {formatListStamp(row.last_message?.created_at)}
                        </span>
                    </span>
                </span>
                <span className="mf-convo-row__preview">{previewText(row)}</span>
            </span>
        </Link>
    );
}

/**
 * Third panel of the desktop shell: your conversations, newest first, on every
 * page except Chat itself (which spans this column with its own thread pane).
 */
export default function ChatRail() {
    const { auth } = usePage().props;
    const [rows, setRows] = useState(cache.rows);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia(DESKTOP_QUERY).matches) {
            return undefined;
        }

        let live = true;

        loadRail().then((next) => {
            if (!live) {
                return;
            }

            if (next === null) {
                setFailed(true);
            } else {
                setRows(next);
            }
        });

        return () => {
            live = false;
        };
    }, [auth?.user?.id]);

    // A rail that can't load stays out of the way: the column keeps its width
    // so the feed doesn't jump, but nothing is claimed that isn't there.
    if (failed) {
        return <div className="mf-gutter" aria-hidden="true" />;
    }

    return (
        <aside className="mf-chat-rail" aria-label="Chats">
            <div className="mf-chat-rail__head">
                <p className="mf-chat-rail__title mf-display">Chats</p>
                <Link href="/social/chat" className="mf-chat-rail__all" prefetch>
                    All
                </Link>
            </div>

            <div className="mf-chat-rail__list">
                {rows === null ? (
                    <div className="mf-chat-rail__ghosts" aria-hidden>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <span key={i} className="mf-chat-rail__ghost" />
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <p className="mf-chat-rail__empty mf-text-meta">
                        No conversations yet.
                        {' '}
                        <Link href="/social/chat?inbox=friends">Start one</Link>
                    </p>
                ) : (
                    rows.map((row) => <RailRow key={`${row.scope}-${row.id}`} row={row} />)
                )}
            </div>
        </aside>
    );
}
