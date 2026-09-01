import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import Composer from './Composer';
import { AuthorAvatar, formatLastSeen, inboxHref, PresenceDot } from './helpers';
import MembersModal from './MembersModal';
import MessageStream from './MessageStream';

function ThreadPresence({ inbox, channel, club, fandom, onOpen }) {
    if (inbox === 'friends') {
        const online = Boolean(channel.peer?.is_online);
        const label = online ? 'Active now' : formatLastSeen(channel.peer?.last_seen_at);

        return (
            <button type="button" className="mf-thread-presence" onClick={onOpen} aria-label="View member">
                <PresenceDot online={online} />
                <span>{label}</span>
            </button>
        );
    }

    const presence = channel.presence;

    if (presence) {
        const noun =
            presence.scope === 'fandom' || presence.scope === 'club'
                ? presence.total === 1 ? 'fan' : 'fans'
                : presence.total === 1 ? 'member' : 'members';

        return (
            <button type="button" className="mf-thread-presence" onClick={onOpen} aria-label="View members">
                <PresenceDot online={presence.online > 0} />
                <span>
                    {presence.online} online <span className="mf-thread-presence__sep" aria-hidden>·</span> {presence.total} {noun}
                </span>
            </button>
        );
    }

    const subtitle =
        inbox === 'fandom'
            ? channel.topic || fandom?.name || 'Fandom radio'
            : inbox === 'club'
                ? channel.topic || club?.name || 'Club radio'
                : channel.topic || 'Private group';

    return <p className="mf-thread-head__sub">{subtitle}</p>;
}

function ThreadHeader({ inbox, channel, club, fandom, realtime, fallbackUrl, onOpenMembers }) {
    const title = inbox === 'fandom' || inbox === 'club' ? `#${channel.name}` : channel.name;

    return (
        <header className="mf-thread-head">
            <Link href={inboxHref(inbox)} className="mf-thread-head__back" aria-label="Back to chats">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6 9 12l6 6" />
                </svg>
            </Link>

            <span className="mf-thread-head__mark">
                {inbox === 'fandom' && fandom?.icon ? (
                    <span className="mf-avatar mf-text-meta h-9 w-9" aria-hidden>
                        {fandom.icon}
                    </span>
                ) : inbox === 'club' && club?.logo_url ? (
                    <img
                        src={club.logo_url}
                        alt=""
                        className="mf-avatar h-9 w-9"
                        onError={(event) => onImageError(event, fallbackUrl)}
                    />
                ) : inbox === 'friends' && channel.peer ? (
                    <AuthorAvatar author={channel.peer} />
                ) : (
                    <span className="mf-avatar mf-text-meta h-9 w-9" aria-hidden>
                        {(channel.name || '?').slice(0, 2).toUpperCase()}
                    </span>
                )}
            </span>

            <div className="mf-thread-head__meta">
                <p className="mf-thread-head__title mf-display">{title}</p>
                <ThreadPresence inbox={inbox} channel={channel} club={club} fandom={fandom} onOpen={onOpenMembers} />
            </div>

            {realtime?.mode ? (
                <span className="mf-chat-live mf-text-micro" title={realtime.note}>
                    <span className="mf-chat-live__dot" aria-hidden />
                    {realtime.mode === 'reverb' ? 'Live' : 'Poll'}
                </span>
            ) : null}
        </header>
    );
}

export default function Thread({
    inbox,
    channel,
    club,
    fandom,
    messages = [],
    hasMore = false,
    oldestId = null,
    maxBodyLength,
    realtime,
    app,
}) {
    const [replyTo, setReplyTo] = useState(null);
    const [membersOpen, setMembersOpen] = useState(false);
    const scrollerRef = useRef(null);
    const fallbackUrl = resolveDefaultImageUrl({ app });

    useEffect(() => {
        setReplyTo(null);
        setMembersOpen(false);
    }, [channel?.id]);

    if (!channel) {
        return (
            <div className="mf-thread mf-thread--blank">
                <div className="mf-empty mf-empty--compact mf-chat-empty">
                    <div className="mf-chat-empty__mark" aria-hidden>
                        <span />
                        <span />
                    </div>
                    <p className="mf-empty-title">Pick a conversation</p>
                    <p>Choose a channel or a chat on the left to start reading.</p>
                </div>
            </div>
        );
    }

    const emptyCopy =
        inbox === 'friends'
            ? { title: 'No messages yet', body: `Say hello to ${channel.name}.` }
            : inbox === 'groups'
                ? { title: 'Quiet group', body: 'Kick off the banter — everyone here sees it.' }
                : {
                    title: 'Quiet radio',
                    body: `Kick the first shout in #${channel.name}${
                        inbox === 'fandom' && fandom?.name
                            ? ` for ${fandom.name}`
                            : club?.name
                                ? ` for ${club.name}`
                                : ''
                    }.`,
                };

    return (
        <div className="mf-thread">
            <ThreadHeader
                inbox={inbox}
                channel={channel}
                club={club}
                fandom={fandom}
                realtime={realtime}
                fallbackUrl={fallbackUrl}
                onOpenMembers={() => setMembersOpen(true)}
            />

            <MessageStream
                items={messages}
                channel={channel}
                inbox={inbox}
                hasMore={hasMore}
                oldestId={oldestId}
                showAuthorNames={inbox !== 'friends'}
                onReply={setReplyTo}
                scrollerRef={scrollerRef}
                emptyCopy={emptyCopy}
            />

            <Composer
                channel={channel}
                maxBodyLength={maxBodyLength}
                inbox={inbox}
                replyTo={replyTo}
                onClearReply={() => setReplyTo(null)}
            />

            {membersOpen ? (
                <MembersModal channel={channel} inbox={inbox} onClose={() => setMembersOpen(false)} />
            ) : null}
        </div>
    );
}
