import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { AuthorAvatar, formatListStamp, INBOXES, inboxHref, PresenceDot } from './helpers';
import NewConversation from './NewConversation';

// Club is a legacy inbox — no longer a selectable tab (see INBOXES in
// helpers.jsx), but a fan who still has a favourite_club_id can land on
// ?inbox=club via an old link, and it renders with the exact same
// channel-list treatment as Fandom.
function isChannelInbox(inbox) {
    return inbox === 'fandom' || inbox === 'club';
}

function previewText(row, inbox) {
    const message = row.last_message;

    if (!message) {
        return isChannelInbox(inbox) ? row.topic || 'No shouts yet' : 'No messages yet';
    }

    const prefix = message.is_mine ? 'You: ' : '';

    if (message.type === 'voice') {
        return `${prefix}Voice message`;
    }

    if (message.type === 'attachment' && !message.body) {
        return `${prefix}Photo`;
    }

    if (!message.body) {
        return `${prefix}Attachment`;
    }

    return `${prefix}${message.body}`;
}

function sortByRecent(rows) {
    return [...rows].sort((a, b) => {
        const aTime = a.last_message?.created_at || '';
        const bTime = b.last_message?.created_at || '';

        if (aTime === bTime) {
            return (b.id || 0) - (a.id || 0);
        }

        return bTime.localeCompare(aTime);
    });
}

function ConversationRow({ row, inbox }) {
    const unread = Number(row.unread_count || 0);

    return (
        <Link
            href={row.href}
            className={`mf-convo-row ${row.is_active ? 'is-active' : ''} ${unread > 0 ? 'has-unread' : ''}`}
            preserveScroll
            preserveState
            prefetch
            aria-current={row.is_active ? 'true' : undefined}
        >
            <span className="mf-convo-row__avatar">
                {isChannelInbox(inbox) ? (
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
                        {unread > 0 ? (
                            <span className="mf-convo-row__unread" aria-label={`${unread} unread messages`}>
                                {unread > 99 ? '99+' : unread}
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
    const source = isChannelInbox(inbox) ? channels : threads;

    const rows = useMemo(() => {
        const sorted = sortByRecent(source);
        const q = query.trim().toLowerCase();
        if (!q) {
            return sorted;
        }

        return sorted.filter((row) =>
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
                        {isChannelInbox(inbox) ? 'Filter channels' : 'Filter chats'}
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                        <circle cx="11" cy="11" r="6.5" strokeWidth="1.75" />
                        <path strokeLinecap="round" strokeWidth="1.75" d="m16 16 3.5 3.5" />
                    </svg>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={isChannelInbox(inbox) ? 'Find a channel' : 'Find a chat'}
                        autoComplete="off"
                    />
                </label>

                {!isChannelInbox(inbox) ? (
                    <NewConversation
                        inbox={inbox}
                        friendCandidates={friendCandidates}
                        groupCandidates={groupCandidates}
                    />
                ) : null}
            </div>

            <div className="mf-convo__list" role="tablist" aria-label={isChannelInbox(inbox) ? 'Channels' : 'Chats'}>
                {rows.length === 0 ? (
                    <p className="mf-convo__empty mf-text-meta">
                        {query.trim()
                            ? 'Nothing matches that.'
                            : isChannelInbox(inbox)
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
