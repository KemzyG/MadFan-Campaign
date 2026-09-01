import { router } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import { IconClose } from '../components/post/icons';
import { socialApi } from '../../../lib/socialApi';
import { applyOptimisticProps, useSocialFlash } from '../optimistic';
import { inboxHref } from './helpers';

const DISAPPEARING_OPTIONS = [
    { value: null, label: 'Off' },
    { value: 86_400, label: '24 hours' },
    { value: 604_800, label: '7 days' },
    { value: 7_776_000, label: '90 days' },
];

function MoreIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
        </svg>
    );
}

function IconMembers() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1a3 3 0 0 0-2-2.83M15 3.1a3 3 0 0 1 0 5.8" />
        </svg>
    );
}

function IconMute() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="M9 9v6l-4-2v-2l4-2V9ZM13 9.5 17 6v12l-4-2.5" />
        </svg>
    );
}

function IconArchive() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="M4 7h16M6 7V5h12v2M5 7l1 14h12l1-14M10 11h4" />
        </svg>
    );
}

function IconTimer() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="13" r="8" strokeWidth="1.85" />
            <path strokeLinecap="round" strokeWidth="1.85" d="M12 9v4l2.5 1.5M9 3h6" />
        </svg>
    );
}

function IconClear() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="M4 7h16M10 11v6M14 11v6M7 7l1 14h10l1-14M9 7V5h6v2" />
        </svg>
    );
}

function IconBlock() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="9" strokeWidth="1.85" />
            <path strokeLinecap="round" strokeWidth="1.85" d="m5 5 14 14" />
        </svg>
    );
}

function NavAction({ icon, label, hint, danger, onClick, disabled }) {
    return (
        <button
            type="button"
            className={`mf-you-nav__item ${danger ? 'is-danger' : ''}`}
            onClick={onClick}
            disabled={disabled}
        >
            <span className="mf-you-nav__item-icon" aria-hidden>
                {icon}
            </span>
            <span className="mf-you-nav__item-copy">
                <span className="mf-you-nav__item-label">{label}</span>
                {hint ? <span className="mf-text-caption mf-you-nav__item-hint">{hint}</span> : null}
            </span>
        </button>
    );
}

function ChatOptionsPanel({ inbox, channel, onOpenMembers, onClose }) {
    const titleId = useId();
    const { reportError, reportSuccess } = useSocialFlash();
    const [busy, setBusy] = useState(false);
    const settings = channel?.settings || {};

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
            }
        };

        document.addEventListener('keydown', onKey);

        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    async function patchPreferences(payload) {
        if (!channel?.id || busy) {
            return;
        }

        setBusy(true);

        try {
            const data = await socialApi(`/chat/channels/${channel.id}/preferences`, {
                method: 'PATCH',
                body: payload,
            });

            applyOptimisticProps((props) => ({
                channel: props.channel
                    ? { ...props.channel, settings: data?.data || props.channel.settings }
                    : props.channel,
            }));

            reportSuccess?.('Chat settings updated.');
        } catch (error) {
            reportError?.(error instanceof Error ? error.message : 'Could not update chat settings.');
        } finally {
            setBusy(false);
        }
    }

    async function clearChat() {
        if (!channel?.id || busy) {
            return;
        }

        if (!confirm('Clear this chat on your device? Messages stay for everyone else.')) {
            return;
        }

        setBusy(true);

        try {
            const data = await socialApi(`/chat/channels/${channel.id}/clear`, { method: 'POST' });

            applyOptimisticProps((props) => ({
                channel: props.channel
                    ? { ...props.channel, settings: data?.data || props.channel.settings }
                    : props.channel,
                messages: {
                    ...props.messages,
                    items: [],
                    has_more: false,
                    oldest_id: null,
                },
            }));

            reportSuccess?.('Chat cleared.');
            onClose?.();
        } catch (error) {
            reportError?.(error instanceof Error ? error.message : 'Could not clear chat.');
        } finally {
            setBusy(false);
        }
    }

    async function toggleMute() {
        await patchPreferences({ muted: !settings.muted });
    }

    async function toggleArchive() {
        const next = !settings.archived;

        await patchPreferences({ archived: next });

        if (next) {
            router.visit(inboxHref(inbox), { preserveScroll: true });
            onClose?.();
        }
    }

    async function setDisappearing(seconds) {
        await patchPreferences({ disappearing_seconds: seconds ?? 0 });
    }

    async function blockPeer() {
        const peerId = channel?.peer?.id;
        if (!peerId) {
            return;
        }

        if (!confirm(`Block ${channel.name}? They won’t be able to message you.`)) {
            return;
        }

        try {
            await socialApi(`/chat/users/${peerId}/block`, { method: 'POST' });
            reportSuccess?.('Fan blocked.');
            onClose?.();
        } catch (error) {
            reportError?.(error instanceof Error ? error.message : 'Could not block fan.');
        }
    }

    const membersLabel =
        inbox === 'friends' ? 'View profile' : inbox === 'groups' ? 'Group members' : 'Channel fans';

    const membersHint =
        inbox === 'friends'
            ? 'See who you are chatting with'
            : inbox === 'groups'
                ? 'See everyone in this group'
                : 'See who is in this channel';

    return (
        <div className="mf-chat-sidepanel is-open" role="presentation">
            <button type="button" className="mf-chat-sidepanel__backdrop" aria-label="Close chat options" onClick={onClose} />

            <aside
                className="mf-chat-sidepanel__drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <header className="mf-chat-sidepanel__head">
                    <div>
                        <p id={titleId} className="mf-display mf-text-title tracking-[0.03em]">
                            Chat options
                        </p>
                        <p className="mf-text-meta mf-chat-sidepanel__sub">{channel?.name}</p>
                    </div>
                    <button type="button" className="mf-stage-icon-btn" aria-label="Close" title="Close" onClick={onClose}>
                        <IconClose />
                    </button>
                </header>

                <div className="mf-chat-sidepanel__scroll">
                    <ul className="mf-you-nav__list" role="none">
                        <li role="none">
                            <NavAction
                                icon={<IconMembers />}
                                label={membersLabel}
                                hint={membersHint}
                                onClick={() => {
                                    onOpenMembers?.();
                                    onClose?.();
                                }}
                                disabled={busy}
                            />
                        </li>
                        <li role="none">
                            <NavAction
                                icon={<IconMute />}
                                label={settings.muted ? 'Unmute notifications' : 'Mute notifications'}
                                hint={settings.muted ? 'Alerts are paused for this chat' : 'Stop alerts from this chat'}
                                onClick={toggleMute}
                                disabled={busy}
                            />
                        </li>
                        <li role="none">
                            <NavAction
                                icon={<IconArchive />}
                                label={settings.archived ? 'Unarchive chat' : 'Archive chat'}
                                hint={settings.archived ? 'Move back to your inbox' : 'Hide from your chat list'}
                                onClick={toggleArchive}
                                disabled={busy}
                            />
                        </li>
                    </ul>

                    <section className="mf-chat-sidepanel__section">
                        <div className="mf-chat-sidepanel__section-head">
                            <span className="mf-chat-sidepanel__section-icon" aria-hidden>
                                <IconTimer />
                            </span>
                            <div>
                                <p className="mf-chat-sidepanel__section-title">Disappearing messages</p>
                                <p className="mf-text-meta">New messages vanish after the timer for you.</p>
                            </div>
                        </div>
                        <div className="mf-chat-sidepanel__chips" role="group" aria-label="Disappearing messages timer">
                            {DISAPPEARING_OPTIONS.map((option) => {
                                const active = (settings.disappearing_seconds ?? null) === option.value;

                                return (
                                    <button
                                        key={option.label}
                                        type="button"
                                        className={`mf-chat-sidepanel__chip ${active ? 'is-active' : ''}`}
                                        onClick={() => setDisappearing(option.value)}
                                        disabled={busy}
                                        aria-pressed={active}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <ul className="mf-you-nav__list" role="none">
                        <li role="none">
                            <NavAction
                                icon={<IconClear />}
                                label="Clear chat"
                                hint="Remove messages on your device only"
                                danger
                                onClick={clearChat}
                                disabled={busy}
                            />
                        </li>
                        {inbox === 'friends' && channel?.peer?.id ? (
                            <li role="none">
                                <NavAction
                                    icon={<IconBlock />}
                                    label="Block fan"
                                    hint="Stop messages from this person"
                                    danger
                                    onClick={blockPeer}
                                    disabled={busy}
                                />
                            </li>
                        ) : null}
                    </ul>
                </div>
            </aside>
        </div>
    );
}

export default function ChatOptionsMenu({ inbox, channel, onOpenMembers }) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className="mf-thread-head__menu"
                onClick={() => setOpen(true)}
                aria-label="Chat options"
                title="Chat options"
            >
                <MoreIcon />
            </button>

            {open ? (
                <ChatOptionsPanel
                    inbox={inbox}
                    channel={channel}
                    onOpenMembers={onOpenMembers}
                    onClose={() => {
                        setOpen(false);
                        triggerRef.current?.focus();
                    }}
                />
            ) : null}
        </>
    );
}
