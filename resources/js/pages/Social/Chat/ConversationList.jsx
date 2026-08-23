import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { AuthorAvatar, formatListStamp, INBOXES, inboxHref, PresenceDot } from './helpers';
import NewConversation from './NewConversation';

function previewText(row, inbox) {
    if (!row.last_message?.body) {
        return inbox === 'club' ? row.topic || 'No shouts yet' : 'No messages yet';
    }

    const prefix = row.last_message.is_mine ? 'You: ' : '';

    return `${prefix}${row.last_message.body}`;
}

function ConversationRow({ row, inbox }) {
    return (
        <Link
            href={row.href}
            className={`mf-convo-row ${row.is_active ? 'is-active' : ''}`}
            preserveScroll
            preserveState
            prefetch
            aria-current={row.is_active ? 'true' : undefined}
        >
            <span className="mf-convo-row__avatar">
                {inbox === 'club' ? (
                    <span className="mf-convo-row__hash mf-mono" aria-hidden>#</span>
                ) : inbox === 'friends' && row.peer ? (
                    <AuthorAvatar author={row.peer} size="lg" />
                ) : (
                    <span className="mf-avatar mf-text-meta h-11 w-11" aria-hidden>
                        {(row.name || '?').slice(0, 2).toUpperCase()}
                    </span>
                )}
                {inbox === 'friends' && row.peer?.is_online ? (
                    <PresenceDot online className="mf-presence-dot--pin" />
                ) : null}
            </span>

            <span className="mf-convo-row__body">
                <span className="mf-convo-row__top">
                    <span className="mf-convo-row__name">{row.name}</span>
                    <span className="mf-convo-row__topmeta">
                        {inbox !== 'friends' && row.online_count > 0 ? (
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
                <span className="mf-convo-row__preview">{previewText(row, inbox)}</span>
            </span>
        </Link>
    );
}

export default function ConversationList({
    inbox,
    channels = [],
    threads = [],
    friendCandidates = [],
    groupCandidates = [],
}) {
    const [query, setQuery] = useState('');
    const source = inbox === 'club' ? channels : threads;

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) {
            return source;
        }

        return source.filter((row) =>
            [row.name, row.slug, row.topic].filter(Boolean).join(' ').toLowerCase().includes(q));
    }, [source, query]);

    return (
        <div className="mf-convo">
            <div className="mf-convo__head">
                <div className="mf-chat-segment" role="tablist" aria-label="Chat inboxes">
                    {INBOXES.map((item) => (
                        <Link
                            key={item.id}
                            href={inboxHref(item.id)}
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
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={inbox === 'club' ? 'Find a channel' : 'Find a chat'}
                        autoComplete="off"
                    />
                </label>

                {inbox !== 'club' ? (
                    <NewConversation
                        inbox={inbox}
                        friendCandidates={friendCandidates}
                        groupCandidates={groupCandidates}
                    />
                ) : null}
            </div>

            <div className="mf-convo__list" role="tablist" aria-label={inbox === 'club' ? 'Channels' : 'Chats'}>
                {rows.length === 0 ? (
                    <p className="mf-convo__empty mf-text-meta">
                        {query.trim()
                            ? 'Nothing matches that.'
                            : inbox === 'club'
                                ? 'No channels yet.'
                                : inbox === 'friends'
                                    ? 'No friend chats yet — start one above.'
                                    : 'No groups yet — create one above.'}
                    </p>
                ) : (
                    rows.map((row) => <ConversationRow key={row.id} row={row} inbox={inbox} />)
                )}
            </div>
        </div>
    );
}
