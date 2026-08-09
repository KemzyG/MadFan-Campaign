import { useForm } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { useStageSession } from './StageSessionContext';

/**
 * Separate room-chat sheet stacked above the Stage modal.
 * Closing returns to the Stage room; voice/session keep running.
 */
export default function StageChatModal({ onClose }) {
    const { room, patchRoom } = useStageSession();
    const { reportError } = useSocialFlash();
    const { data, setData, post, processing, errors, reset } = useForm({ body: '' });
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    const stage = room?.stage;
    const messages = room?.messages || [];
    const me = room?.me;
    const maxMessageLength = room?.max_message_length ?? 280;
    const canChat = stage?.status === 'live' && Boolean(me);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    useEffect(() => {
        if (canChat) {
            inputRef.current?.focus();
        }
    }, [canChat]);

    if (!stage) {
        return null;
    }

    function submit(e) {
        e.preventDefault();
        if (!data.body.trim() || !canChat) {
            return;
        }
        const body = data.body.trim();
        const tempId = `tmp-msg-${Date.now()}`;

        patchRoom((props) => ({
            ...props,
            messages: [
                ...(props.messages || []),
                {
                    id: tempId,
                    body,
                    created_at: new Date().toISOString(),
                    user: me?.user || { name: 'You' },
                    _optimistic: true,
                },
            ],
        }));

        post(
            `/social/stage/${stage.id}/messages`,
            withRollbackFlash(reportError, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => reset('body'),
            }),
        );
    }

    return (
        <div className="mf-stage-chat-modal" role="dialog" aria-modal="true" aria-label="Room chat">
            <button
                type="button"
                className="mf-stage-chat-modal__backdrop"
                aria-label="Close room chat"
                onClick={onClose}
            />
            <div className="mf-stage-chat-modal__panel">
                <div className="mf-stage-chat-modal__chrome">
                    <div className="mf-stage-chat-modal__brand">
                        <span className="mf-stage-chat-modal__mark" aria-hidden />
                        <div className="mf-stage-chat-modal__titles min-w-0">
                            <p className="mf-stage-chat-modal__kicker mf-mono">Room chat</p>
                            <p className="mf-stage-chat-modal__title truncate">{stage?.title}</p>
                        </div>
                    </div>
                    <div className="mf-stage-chat-modal__tools">
                        <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">{messages.length}</span>
                        <button type="button" className="mf-stage-chat-modal__close" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>

                <div className="mf-stage-chat mf-stage-chat--sheet">
                    <div className="mf-stage-chat__stream">
                        {messages.length === 0 ? (
                            <p className="mf-stage-chat__empty mf-text-meta text-[var(--mf-muted)]">
                                No messages yet — say something from the terrace.
                            </p>
                        ) : (
                            messages.map((message) => (
                                <article
                                    key={message.id}
                                    className={`mf-stage-chat__msg ${message._optimistic ? 'is-optimistic' : ''}`}
                                >
                                    <span className="mf-stage-chat__who">{message.user?.name || 'Fan'}</span>
                                    <span className="mf-stage-chat__body">{message.body}</span>
                                </article>
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {canChat ? (
                        <form className="mf-stage-chat__composer" onSubmit={submit}>
                            <input
                                ref={inputRef}
                                className="mf-stage-chat__input"
                                maxLength={maxMessageLength}
                                placeholder="Say something on Stage…"
                                value={data.body}
                                onChange={(e) => setData('body', e.target.value)}
                                disabled={processing}
                                aria-label="Stage chat message"
                            />
                            <button
                                type="submit"
                                className="mf-btn mf-btn--pitch"
                                disabled={processing || !data.body.trim()}
                            >
                                Send
                            </button>
                            {errors.body ? <p className="mf-field-error">{errors.body}</p> : null}
                        </form>
                    ) : (
                        <p className="mf-text-meta text-[var(--mf-muted)] mf-stage-chat__closed">
                            Stage ended — chat closed.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
