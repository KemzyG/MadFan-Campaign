import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { socialApi } from '../../../lib/socialApi';
import { applyOptimisticProps, useSocialFlash } from '../optimistic';
import { markChatMessageDeleted } from './chatRealtime';

function IconReply() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="M10 9V5l-6 6 6 6v-4h4a5 5 0 0 1 5 5v1" />
        </svg>
    );
}

function IconEdit() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
    );
}

function IconTrash() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V5h6v2" />
        </svg>
    );
}

function IconFlag() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="M5 21V5M5 5h11l-2 3 2 3H5" />
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

function previewSnippet(message) {
    if (message.deleted) {
        return 'Message deleted';
    }

    if (message.type === 'voice') {
        return 'Voice message';
    }

    if (message.media && !message.body) {
        return message.media.type === 'video' ? 'Video' : message.media.type === 'audio' ? 'Voice message' : 'Photo';
    }

    const text = (message.body || '').trim();

    return text.length > 72 ? `${text.slice(0, 72)}…` : text || 'Message';
}

function ActionRow({ icon, label, hint, danger, onClick }) {
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

export default function MessageActionSheet({ message, inbox, onEdit, onReply, onClose }) {
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

    async function remove() {
        if (!confirm('Delete this message?')) {
            return;
        }

        try {
            await socialApi(`/chat/messages/${message.id}`, { method: 'DELETE' });
            applyOptimisticProps((props) => ({
                messages: {
                    ...props.messages,
                    items: markChatMessageDeleted(props.messages?.items || [], message.id),
                },
            }));
            reportSuccess?.('Message deleted.');
            onClose?.();
        } catch (error) {
            reportError?.(error instanceof Error ? error.message : 'Could not delete message.');
        }
    }

    async function report() {
        try {
            await socialApi(`/chat/messages/${message.id}/report`, {
                method: 'POST',
                body: { reason: 'abuse' },
            });
            reportSuccess?.('Report submitted.');
            onClose?.();
        } catch (error) {
            reportError?.(error instanceof Error ? error.message : 'Could not submit report.');
        }
    }

    async function blockAuthor() {
        if (!message.author?.id) {
            return;
        }

        try {
            await socialApi(`/chat/users/${message.author.id}/block`, { method: 'POST' });
            reportSuccess?.('Fan blocked.');
            onClose?.();
        } catch (error) {
            reportError?.(error instanceof Error ? error.message : 'Could not block fan.');
        }
    }

    if (typeof document === 'undefined' || !message) {
        return null;
    }

    const authorName = message.is_mine ? 'You' : message.author?.name || 'Fan';

    return createPortal(
        <div className="mf-chat-sheet" role="dialog" aria-modal="true" aria-label="Message actions">
            <button type="button" className="mf-chat-sheet__backdrop" aria-label="Close actions" onClick={onClose} />

            <div className="mf-chat-sheet__panel mf-chat-sheet__panel--actions">
                <div className="mf-chat-sheet__handle" aria-hidden />

                <header className="mf-chat-sheet__preview">
                    <p className="mf-chat-sheet__preview-author mf-text-meta">{authorName}</p>
                    <p className="mf-chat-sheet__preview-body">{previewSnippet(message)}</p>
                </header>

                <div className="mf-chat-sheet__group">
                    <ActionRow
                        icon={<IconReply />}
                        label="Reply"
                        hint="Quote this message in your reply"
                        onClick={() => {
                            onReply?.(message);
                            onClose?.();
                        }}
                    />
                    {message.can_edit ? (
                        <ActionRow
                            icon={<IconEdit />}
                            label="Edit"
                            hint="Change what you wrote"
                            onClick={() => {
                                onEdit?.(message);
                                onClose?.();
                            }}
                        />
                    ) : null}
                    {message.can_delete ? (
                        <ActionRow
                            icon={<IconTrash />}
                            label="Delete"
                            hint="Remove for everyone in this chat"
                            danger
                            onClick={remove}
                        />
                    ) : null}
                </div>

                {!message.is_mine ? (
                    <div className="mf-chat-sheet__group">
                        <ActionRow
                            icon={<IconFlag />}
                            label="Report"
                            hint="Flag inappropriate content"
                            onClick={report}
                        />
                        {inbox === 'friends' && message.author?.id ? (
                            <ActionRow
                                icon={<IconBlock />}
                                label="Block fan"
                                hint="Stop messages from this person"
                                danger
                                onClick={blockAuthor}
                            />
                        ) : null}
                    </div>
                ) : null}

                <button type="button" className="mf-chat-sheet__cancel" onClick={onClose}>
                    Cancel
                </button>
            </div>
        </div>,
        document.body,
    );
}
