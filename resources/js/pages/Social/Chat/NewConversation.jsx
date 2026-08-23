import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useSocialFlash } from '../optimistic';
import { AuthorAvatar } from './helpers';

function FriendPicker({ candidates, onDone }) {
    const [processing, setProcessing] = useState(false);

    if (!candidates.length) {
        return (
            <p className="mf-convo-new__hint mf-text-meta">
                Follow fans first — you can only DM people you are connected to.
            </p>
        );
    }

    function start(userId) {
        if (processing) {
            return;
        }

        setProcessing(true);
        router.post('/social/chat/direct', { user_id: userId }, {
            preserveScroll: true,
            onSuccess: () => onDone?.(),
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <ul className="mf-convo-new__list">
            {candidates.map((fan) => (
                <li key={fan.id}>
                    <button type="button" onClick={() => start(fan.id)} disabled={processing}>
                        <AuthorAvatar author={fan} size="sm" />
                        <span className="min-w-0">
                            <span className="mf-convo-new__name">{fan.name}</span>
                            {fan.handle ? (
                                <span className="mf-text-meta text-[var(--mf-muted)]">@{fan.handle}</span>
                            ) : null}
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );
}

function GroupBuilder({ candidates, onDone }) {
    const { reportError } = useSocialFlash();
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
            onError: () => reportError?.('Group not created — check the name and members.'),
            onSuccess: () => {
                setName('');
                setSelected([]);
                onDone?.();
            },
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <form className="mf-convo-new__form" onSubmit={submit}>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
                maxLength={60}
                required
            />
            {candidates.length ? (
                <ul className="mf-convo-new__list">
                    {candidates.map((fan) => {
                        const checked = selected.includes(fan.id);
                        return (
                            <li key={fan.id}>
                                <button
                                    type="button"
                                    className={checked ? 'is-selected' : ''}
                                    onClick={() => toggle(fan.id)}
                                    aria-pressed={checked}
                                >
                                    <AuthorAvatar author={fan} size="sm" />
                                    <span className="min-w-0">
                                        <span className="mf-convo-new__name">{fan.name}</span>
                                        {fan.handle ? (
                                            <span className="mf-text-meta text-[var(--mf-muted)]">
                                                @{fan.handle}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span className="mf-convo-new__check" aria-hidden>
                                        {checked ? '✓' : ''}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="mf-convo-new__hint mf-text-meta">
                    Follow fans first to invite them into a group.
                </p>
            )}
            <button
                type="submit"
                className="mf-convo-new__submit"
                disabled={processing || !name.trim() || selected.length === 0}
            >
                {processing ? 'Creating…' : `Create group${selected.length ? ` · ${selected.length}` : ''}`}
            </button>
        </form>
    );
}

/**
 * One "New" affordance for both friend DMs and groups, collapsed by default so
 * the conversation list stays the focus of the page.
 */
export default function NewConversation({ inbox, friendCandidates = [], groupCandidates = [] }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`mf-convo-new ${open ? 'is-open' : ''}`}>
            <button
                type="button"
                className="mf-convo-new__toggle"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
            >
                <span className="mf-convo-new__plus" aria-hidden>
                    {open ? '×' : '+'}
                </span>
                {open ? 'Close' : inbox === 'friends' ? 'New chat' : 'New group'}
            </button>

            {open ? (
                <div className="mf-convo-new__panel">
                    {inbox === 'friends' ? (
                        <FriendPicker candidates={friendCandidates} onDone={() => setOpen(false)} />
                    ) : (
                        <GroupBuilder candidates={groupCandidates} onDone={() => setOpen(false)} />
                    )}
                </div>
            ) : null}
        </div>
    );
}
