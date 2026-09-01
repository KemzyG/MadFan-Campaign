import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { socialApi } from '../../../lib/socialApi';
import { AuthorAvatar, formatLastSeen, PresenceDot } from './helpers';

function MemberRow({ member }) {
    return (
        <li className="mf-members-modal__row">
            <span className="mf-members-modal__avatar">
                <AuthorAvatar author={member} />
                <PresenceDot online={member.is_online} className="mf-presence-dot--pin" />
            </span>
            <span className="mf-members-modal__rowbody">
                <span className="mf-members-modal__name">{member.name}</span>
                {member.handle ? (
                    <span className="mf-members-modal__handle mf-text-meta">@{member.handle}</span>
                ) : null}
            </span>
            <span className="mf-members-modal__seen mf-text-micro">
                {member.is_online ? 'Active now' : formatLastSeen(member.last_seen_at)}
            </span>
        </li>
    );
}

export default function MembersModal({ channel, inbox, onClose }) {
    const [state, setState] = useState({ status: 'loading', data: null });
    const [query, setQuery] = useState('');
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    // Fetch the roster when the modal opens.
    useEffect(() => {
        let live = true;
        setState({ status: 'loading', data: null });

        socialApi(`/chat/channels/${channel.id}/members`)
            .then((payload) => live && setState({ status: 'ready', data: payload?.data ?? null }))
            .catch(() => live && setState({ status: 'error', data: null }));

        return () => {
            live = false;
        };
    }, [channel.id]);

    // Escape to close + lock the page behind the sheet.
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape') {
                closeRef.current?.();
            }
        };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, []);

    const data = state.data;
    const isDirect = data?.scope === 'direct';
    const label = isDirect
        ? data?.members?.[0]?.name || 'Member'
        : data?.title || (inbox === 'fandom' || inbox === 'club' ? 'Fans' : 'Members');

    const filtered = useMemo(() => {
        const members = data?.members ?? [];
        const q = query.trim().toLowerCase();
        if (!q) {
            return members;
        }

        return members.filter((member) =>
            [member.name, member.handle].filter(Boolean).join(' ').toLowerCase().includes(q));
    }, [data, query]);

    const online = filtered.filter((member) => member.is_online);
    const offline = filtered.filter((member) => !member.is_online);
    const showSearch = data && !isDirect && data.total_count > 8;
    const bounded =
        (data?.scope === 'fandom' || data?.scope === 'club')
        && !query.trim()
        && (data.members?.length ?? 0) < data.total_count;

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div className="mf-members-modal" role="dialog" aria-modal="true" aria-label={label}>
            <button
                type="button"
                className="mf-members-modal__backdrop"
                aria-label="Close members"
                onClick={onClose}
            />

            <div className="mf-members-modal__panel">
                <header className="mf-members-modal__head">
                    <div className="mf-members-modal__heading">
                        <p className="mf-members-modal__title mf-display">{label}</p>
                        {data && !isDirect ? (
                            <p className="mf-members-modal__count mf-text-meta">
                                {data.online_count} online · {data.total_count} {label.toLowerCase()}
                            </p>
                        ) : null}
                    </div>
                    <button type="button" className="mf-members-modal__close" onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
                        </svg>
                    </button>
                </header>

                {showSearch ? (
                    <label className="mf-chat-search mf-members-modal__search">
                        <span className="sr-only">Filter members</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                            <circle cx="11" cy="11" r="6.5" strokeWidth="1.75" />
                            <path strokeLinecap="round" strokeWidth="1.75" d="m16 16 3.5 3.5" />
                        </svg>
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Find someone"
                            autoComplete="off"
                        />
                    </label>
                ) : null}

                <div className="mf-members-modal__scroll">
                    {state.status === 'loading' ? (
                        <div className="mf-members-modal__ghosts" aria-hidden>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <span key={i} className="mf-members-modal__ghost" />
                            ))}
                        </div>
                    ) : state.status === 'error' ? (
                        <p className="mf-members-modal__empty mf-text-meta">Couldn’t load members. Try again.</p>
                    ) : filtered.length === 0 ? (
                        <p className="mf-members-modal__empty mf-text-meta">
                            {query.trim() ? 'Nobody matches that.' : 'No one here yet.'}
                        </p>
                    ) : (
                        <>
                            {online.length > 0 ? (
                                <section className="mf-members-modal__section">
                                    <p className="mf-members-modal__section-label mf-text-micro">
                                        Online — {online.length}
                                    </p>
                                    <ul className="mf-members-modal__list">
                                        {online.map((member) => <MemberRow key={member.id} member={member} />)}
                                    </ul>
                                </section>
                            ) : null}

                            {offline.length > 0 ? (
                                <section className="mf-members-modal__section">
                                    <p className="mf-members-modal__section-label mf-text-micro">Offline</p>
                                    <ul className="mf-members-modal__list">
                                        {offline.map((member) => <MemberRow key={member.id} member={member} />)}
                                    </ul>
                                </section>
                            ) : null}

                            {bounded ? (
                                <p className="mf-members-modal__note mf-text-micro">
                                    Showing recent fans · {data.total_count} total
                                </p>
                            ) : null}
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
