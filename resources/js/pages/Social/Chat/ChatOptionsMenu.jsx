import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { socialApi } from '../../../lib/socialApi';
import { useSocialFlash } from '../optimistic';

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

function IconBlock() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="9" strokeWidth="1.85" />
            <path strokeLinecap="round" strokeWidth="1.85" d="m5 5 14 14" />
        </svg>
    );
}

function MenuAction({ icon, label, hint, danger, onClick }) {
    return (
        <button type="button" className={`mf-chat-sheet__action ${danger ? 'is-danger' : ''}`} onClick={onClick}>
            <span className="mf-chat-sheet__action-icon" aria-hidden>
                {icon}
            </span>
            <span className="mf-chat-sheet__action-copy">
                <span className="mf-chat-sheet__action-label">{label}</span>
                {hint ? <span className="mf-chat-sheet__action-hint mf-text-meta">{hint}</span> : null}
            </span>
        </button>
    );
}

function ChatOptionsSheet({ inbox, channel, realtime, onOpenMembers, onClose }) {
    const { reportError, reportSuccess } = useSocialFlash();

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
            }
        };

        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

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
        inbox === 'friends'
            ? 'View profile'
            : inbox === 'groups'
                ? 'Group members'
                : 'Channel fans';

    const membersHint =
        inbox === 'friends'
            ? 'See who you are chatting with'
            : inbox === 'groups'
                ? 'See everyone in this group'
                : 'See who is in this channel';

    return createPortal(
        <div className="mf-chat-sheet" role="dialog" aria-modal="true" aria-label="Chat options">
            <button type="button" className="mf-chat-sheet__backdrop" aria-label="Close chat options" onClick={onClose} />

            <div className="mf-chat-sheet__panel">
                <div className="mf-chat-sheet__handle" aria-hidden />

                <header className="mf-chat-sheet__preview">
                    <p className="mf-chat-sheet__preview-author mf-text-meta">Chat options</p>
                    <p className="mf-chat-sheet__preview-body">{channel?.name || 'Conversation'}</p>
                </header>

                <div className="mf-chat-sheet__group">
                    <MenuAction
                        icon={<IconMembers />}
                        label={membersLabel}
                        hint={membersHint}
                        onClick={() => {
                            onOpenMembers?.();
                            onClose?.();
                        }}
                    />
                    {inbox === 'friends' && channel?.peer?.id ? (
                        <MenuAction
                            icon={<IconBlock />}
                            label="Block fan"
                            hint="Stop messages from this person"
                            danger
                            onClick={blockPeer}
                        />
                    ) : null}
                </div>

                {realtime?.mode ? (
                    <p className="mf-chat-sheet__footnote mf-text-micro">
                        Realtime: {realtime.mode === 'reverb' ? 'Live updates enabled' : 'Polling fallback'}
                    </p>
                ) : null}

                <button type="button" className="mf-chat-sheet__cancel" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>,
        document.body,
    );
}

export default function ChatOptionsMenu({ inbox, channel, realtime, onOpenMembers }) {
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
                <ChatOptionsSheet
                    inbox={inbox}
                    channel={channel}
                    realtime={realtime}
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
