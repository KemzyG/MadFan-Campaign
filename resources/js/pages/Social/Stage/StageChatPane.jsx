import { useForm } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { formatTime } from '../Chat/helpers';
import PinnedMessage from './PinnedMessage';
import { IconPin, IconSend } from './StageIcons';
import { useStageSession } from './StageSessionContext';

/**
 * In-pane room chat. Same optimistic `tmp-msg-` push the modal used, plus a
 * pinned banner and a per-message pin control for the host.
 *
 * This component stays mounted for the whole Stage session — it's a
 * permanent sibling in both the mobile swipe carousel and the desktop column
 * layout, never remounted when the user scrolls/taps to another pane. So
 * "seen while mounted" doesn't track "seen while actually looking at it";
 * an IntersectionObserver on the root element does, for both layouts (a
 * carousel pane scrolled out of `.mf-stageroom`'s clipped scrollport reports
 * as non-intersecting even against the default viewport root, and a desktop
 * column that's simply always on-screen reports as intersecting).
 */
export default function StageChatPane() {
    const { room, patchRoom, openChat, closeChat } = useStageSession();
    const { reportError } = useSocialFlash();
    const { data, setData, post, processing, errors, reset } = useForm({ body: '' });
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    // A callback ref, not useRef: the pane's root only exists once `stage` is
    // loaded (this component renders null until then), so a plain ref +
    // mount-only effect would attach to a still-null node and never retry.
    const [paneNode, setPaneNode] = useState(null);
    const [visible, setVisible] = useState(false);

    const stage = room?.stage;
    const messages = room?.messages || [];
    const me = room?.me;
    const maxMessageLength = room?.max_message_length ?? 280;
    const canChat = stage?.status === 'live' && Boolean(me) && stage?.allow_chat !== false;
    const chatDisabled = stage?.allow_chat === false;
    const isHost = me?.role === 'host';
    const pinnedId = room?.pinned_message?.id ?? null;
    const stageId = stage?.id;

    useEffect(() => {
        if (!paneNode) {
            return undefined;
        }
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
            threshold: 0.6,
        });
        observer.observe(paneNode);
        return () => observer.disconnect();
    }, [paneNode]);

    // Reset the unread badge only while the pane is actually on screen.
    useEffect(() => {
        if (visible) {
            openChat();
        } else {
            closeChat();
        }
    }, [visible, openChat, closeChat]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

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

        const rollback = patchRoom((props) => ({
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
            `/social/stage/${stageId}/messages`,
            withRollbackFlash(reportError, {
                preserveScroll: true,
                preserveState: true,
                rollback,
                onSuccess: () => reset('body'),
            }),
        );
    }

    function pin(message) {
        const rollback = patchRoom((props) => ({
            ...props,
            pinned_message: {
                id: message.id,
                body: message.body,
                created_at: message.created_at,
                user: message.user,
            },
        }));
        router.post(
            `/social/stage/${stageId}/pin`,
            { message_id: message.id },
            withRollbackFlash(reportError, { preserveState: true, rollback }),
        );
    }

    return (
        <div className="mf-stage-chat" aria-label="Room chat" ref={setPaneNode}>
            <PinnedMessage />

            <div className="mf-stage-chat__stream">
                {messages.length === 0 ? (
                    <p className="mf-stage-chat__empty mf-text-meta text-[var(--mf-muted)]">
                        No messages yet — say something from the terrace.
                    </p>
                ) : (
                    messages.map((message) => {
                        const canPin = isHost && !String(message.id).startsWith('tmp');
                        const pinnedHere = pinnedId != null && pinnedId === message.id;

                        return (
                            <article
                                key={message.id}
                                className={[
                                    'mf-stage-chat__msg',
                                    message._optimistic ? 'is-optimistic' : '',
                                    pinnedHere ? 'is-pinned' : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            >
                                <div className="mf-stage-chat__msg-main min-w-0">
                                    <span className="mf-stage-chat__who">
                                        {message.user?.name || 'Fan'}
                                        <span className="mf-stage-chat__time mf-mono">
                                            {formatTime(message.created_at)}
                                        </span>
                                    </span>
                                    <span className="mf-stage-chat__body">{message.body}</span>
                                </div>
                                {canPin ? (
                                    <button
                                        type="button"
                                        className={`mf-stage-chat__pin ${pinnedHere ? 'is-pinned' : ''}`.trim()}
                                        aria-label={pinnedHere ? 'Pinned message' : 'Pin message'}
                                        title={pinnedHere ? 'Pinned' : 'Pin message'}
                                        onClick={() => pin(message)}
                                    >
                                        <IconPin active={pinnedHere} />
                                    </button>
                                ) : null}
                            </article>
                        );
                    })
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
                        className="mf-stage-chat__send"
                        disabled={processing || !data.body.trim()}
                        aria-label="Send message"
                    >
                        <IconSend />
                    </button>
                    {errors.body ? <p className="mf-field-error mf-stage-chat__error">{errors.body}</p> : null}
                </form>
            ) : chatDisabled ? (
                <p className="mf-text-meta text-[var(--mf-muted)] mf-stage-chat__closed">
                    Chat is disabled for this Stage.
                </p>
            ) : (
                <p className="mf-text-meta text-[var(--mf-muted)] mf-stage-chat__closed">
                    Stage ended — chat closed.
                </p>
            )}
        </div>
    );
}
