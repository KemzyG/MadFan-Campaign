import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { socialApi } from '../../../lib/socialApi';
import { applyOptimisticProps, useSocialFlash } from '../optimistic';
import { slowmodeSecondsFromError } from './chatRealtime';
import ReplyQuote from './ReplyQuote';
import { formatVoiceDuration, useVoiceRecorder } from './useVoiceRecorder';

function IconAttach() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.85"
                d="M17.5 8.5 9.9 16.1a3 3 0 0 1-4.24-4.24l7.6-7.6a5 5 0 0 1 7.07 7.07l-7.6 7.6a1 1 0 0 1-1.42-1.41l7.24-7.25"
            />
        </svg>
    );
}

function IconMic() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.85"
                d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="M19 11a7 7 0 0 1-14 0M12 18v3" />
        </svg>
    );
}

function IconSend() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 14-7-7 14-2-5-5-2Z" />
        </svg>
    );
}

function IconClose() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
        </svg>
    );
}

export default function Composer({ channel, maxBodyLength, inbox, replyTo, onClearReply }) {
    const page = usePage();
    const user = page.props?.auth?.user;
    const { reportError } = useSocialFlash();
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const [body, setBody] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [slowmodeUntil, setSlowmodeUntil] = useState(0);
    const [slowmodeTick, setSlowmodeTick] = useState(0);

    const voice = useVoiceRecorder();

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) {
            return;
        }

        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, [body]);

    useEffect(() => {
        if (replyTo) {
            textareaRef.current?.focus();
        }
    }, [replyTo?.id]);

    useEffect(() => () => {
        if (attachmentPreview) {
            URL.revokeObjectURL(attachmentPreview);
        }
    }, [attachmentPreview]);

    useEffect(() => {
        if (slowmodeUntil <= Date.now()) {
            return undefined;
        }

        const timer = window.setInterval(() => setSlowmodeTick(Date.now()), 500);

        return () => window.clearInterval(timer);
    }, [slowmodeUntil, slowmodeTick]);

    const slowmodeRemaining = Math.max(0, Math.ceil((slowmodeUntil - Date.now()) / 1000));
    const isSlowmodeActive = slowmodeRemaining > 0;

    function pickAttachment(event) {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        voice.clearPreview();

        if (attachmentPreview) {
            URL.revokeObjectURL(attachmentPreview);
        }

        setAttachment(file);
        setAttachmentPreview(URL.createObjectURL(file));
    }

    function clearAttachment() {
        if (attachmentPreview) {
            URL.revokeObjectURL(attachmentPreview);
        }
        setAttachment(null);
        setAttachmentPreview(null);
    }

    async function submit(e) {
        e?.preventDefault?.();

        const voiceFile = voice.preview?.file ?? null;
        const mediaFile = attachment ?? voiceFile;
        const text = body.trim();

        if ((!text && !mediaFile) || channel?.is_read_only || processing || !channel?.id || isSlowmodeActive) {
            return;
        }

        const replyToId = replyTo?.id ?? null;
        const quoted = replyTo
            ? {
                id: replyTo.id,
                body: replyTo.body,
                author_name: replyTo.author?.name ?? null,
                type: replyTo.type,
            }
            : null;
        const tempId = `tmp-chat-${Date.now()}`;
        const isVoice = Boolean(voiceFile);
        const pendingMedia = mediaFile
            ? {
                url: isVoice ? voice.preview.url : attachmentPreview,
                type: isVoice ? 'audio' : mediaFile.type.startsWith('video/') ? 'video' : 'image',
            }
            : null;
        const sentAttachment = mediaFile;

        setProcessing(true);
        setBody('');
        clearAttachment();
        voice.clearPreview();
        onClearReply?.();

        const rollback = applyOptimisticProps((props) => {
            const items = props.messages?.items || [];

            return {
                messages: {
                    ...props.messages,
                    items: [
                        ...items,
                        {
                            id: tempId,
                            body: text || null,
                            media: pendingMedia,
                            type: isVoice ? 'voice' : pendingMedia ? 'attachment' : 'text',
                            created_at: new Date().toISOString(),
                            edited_at: null,
                            deleted: false,
                            is_mine: true,
                            author: {
                                id: user?.id,
                                name: user?.name || 'You',
                                handle: user?.handle,
                                fan_id: user?.fan_id,
                                avatar_url: user?.avatar_url,
                                avatar_emoji: user?.avatar_emoji,
                            },
                            reply_to: quoted,
                            can_edit: false,
                            can_delete: false,
                            _optimistic: true,
                        },
                    ],
                },
            };
        });

        try {
            let payload;
            if (sentAttachment) {
                payload = new FormData();
                if (text) {
                    payload.append('body', text);
                }
                if (replyToId) {
                    payload.append('reply_to_message_id', replyToId);
                }
                payload.append('attachment', sentAttachment);
            } else {
                payload = { body: text, ...(replyToId ? { reply_to_message_id: replyToId } : {}) };
            }

            const data = await socialApi(`/chat/channels/${channel.id}/messages`, {
                method: 'POST',
                body: payload,
            });

            applyOptimisticProps((props) => {
                const items = props.messages?.items || [];
                const presented = data?.data;

                return {
                    messages: {
                        ...props.messages,
                        items: items.map((item) =>
                            item.id === tempId
                                ? { ...(presented || item), is_mine: true, _optimistic: false }
                                : item),
                    },
                };
            });
        } catch (error) {
            rollback();
            setBody(text);
            const message = error instanceof Error && error.message ? error.message : 'Message failed — rolled back.';
            const slowmode = slowmodeSecondsFromError(message);
            if (slowmode) {
                setSlowmodeUntil(Date.now() + slowmode * 1000);
            }
            reportError?.(message);
        } finally {
            setProcessing(false);
        }
    }

    const placeholder =
        inbox === 'friends'
            ? `Message ${channel?.name || 'friend'}`
            : inbox === 'groups'
                ? `Message ${channel?.name || 'group'}`
                : `Message #${channel?.name || 'general'}`;

    if (channel?.is_read_only) {
        return (
            <div className="mf-chat-composer">
                <p className="mf-chat-composer__closed mf-text-meta">This channel is read-only.</p>
            </div>
        );
    }

    const canSend = !processing && !isSlowmodeActive && (body.trim() || attachment || voice.preview);

    return (
        <form className="mf-chat-composer mf-chat-composer--v2" onSubmit={submit}>
            {replyTo ? (
                <ReplyQuote
                    variant="composer"
                    authorName={replyTo.author?.name}
                    body={replyTo.body}
                    type={replyTo.type}
                    onDismiss={onClearReply}
                />
            ) : null}

            {(attachmentPreview || voice.preview) ? (
                <div className="mf-chat-composer__previews">
                    {attachmentPreview ? (
                        <div className="mf-chat-composer__preview">
                            {attachment?.type.startsWith('video/') ? (
                                <video src={attachmentPreview} muted />
                            ) : (
                                <img src={attachmentPreview} alt="" />
                            )}
                            <button type="button" className="mf-chat-composer__preview-remove" onClick={clearAttachment} aria-label="Remove attachment">
                                <IconClose />
                            </button>
                        </div>
                    ) : null}
                    {voice.preview ? (
                        <div className="mf-chat-composer__preview mf-chat-composer__preview--voice">
                            <audio src={voice.preview.url} controls />
                            <span className="mf-text-micro">{formatVoiceDuration(voice.elapsedMs || voice.preview.durationMs)}</span>
                            <button type="button" className="mf-chat-composer__preview-remove" onClick={voice.clearPreview} aria-label="Remove voice note">
                                <IconClose />
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {voice.recording ? (
                <div className="mf-chat-composer__recording" role="status">
                    <span className="mf-chat-composer__recording-dot" aria-hidden />
                    <span>Recording {formatVoiceDuration(voice.elapsedMs)}</span>
                    <button type="button" className="mf-chat-composer__recording-stop" onClick={voice.stopRecording}>
                        Stop
                    </button>
                </div>
            ) : null}

            {voice.error ? <p className="mf-chat-composer__voice-error mf-text-meta">{voice.error}</p> : null}

            <div className="mf-chat-composer__dock">
                <div className="mf-chat-composer__tools">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                        onChange={pickAttachment}
                        hidden
                    />
                    <button
                        type="button"
                        className="mf-chat-composer__tool"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={processing || voice.recording}
                        aria-label="Attach photo or video"
                        title="Attach photo or video"
                    >
                        <IconAttach />
                    </button>
                    <button
                        type="button"
                        className={`mf-chat-composer__tool ${voice.recording ? 'is-active' : ''}`}
                        onClick={voice.recording ? voice.stopRecording : voice.startRecording}
                        disabled={processing || Boolean(attachment)}
                        aria-label={voice.recording ? 'Stop recording' : 'Record voice note'}
                        title={voice.recording ? 'Stop recording' : 'Record voice note'}
                    >
                        <IconMic />
                    </button>
                </div>

                <div className="mf-chat-composer__field">
                    <textarea
                        ref={textareaRef}
                        className="mf-chat-composer__input"
                        rows={1}
                        maxLength={maxBodyLength}
                        placeholder={isSlowmodeActive ? `Slowmode — wait ${slowmodeRemaining}s` : placeholder}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape' && replyTo) {
                                e.preventDefault();
                                onClearReply?.();

                                return;
                            }
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                submit(e);
                            }
                        }}
                        disabled={processing || voice.recording || isSlowmodeActive}
                        aria-label="Chat message"
                    />
                </div>

                <button
                    type="submit"
                    className="mf-chat-composer__send"
                    disabled={!canSend}
                    aria-label={processing ? 'Sending' : 'Send message'}
                >
                    <IconSend />
                </button>
            </div>

            <div className="mf-chat-composer__bar">
                <span className="mf-chat-composer__hint mf-text-meta text-[var(--mf-muted)]">
                    {isSlowmodeActive ? `Slowmode active · ${slowmodeRemaining}s left` : 'Enter to send · Shift+Enter for line'}
                </span>
                <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">
                    {body.length}/{maxBodyLength}
                </span>
            </div>
        </form>
    );
}
