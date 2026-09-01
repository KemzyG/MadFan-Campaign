/**
 * The hanging reply quote — chat's signature element.
 *
 * Rendered inside a bubble (`variant="bubble"`) it hangs off the top of the
 * message and jumps to the original on click. Above the composer
 * (`variant="composer"`) it shows what you are about to answer.
 */
export default function ReplyQuote({
    authorName,
    body,
    type,
    variant = 'bubble',
    onJump,
    onDismiss,
    label = 'Replying to',
}) {
    const who = authorName || 'Fan';
    // A caption-less photo/video message legitimately has no body (see
    // SendChatMessage) — that's not the same as the quoted message being
    // unavailable, so don't conflate the two behind one fallback string.
    const text = body
        || (type === 'voice' ? 'Voice note' : type === 'attachment' ? 'Photo or video' : 'Message unavailable');

    const inner = (
        <>
            <span className="mf-chat-quote__spine" aria-hidden />
            <span className="mf-chat-quote__stack">
                <span className="mf-chat-quote__who">
                    {variant === 'composer' ? `${label} ${who}` : who}
                </span>
                <span className="mf-chat-quote__body">{text}</span>
            </span>
        </>
    );

    if (variant === 'composer') {
        return (
            <div className="mf-chat-quote is-composer">
                {inner}
                {onDismiss ? (
                    <button
                        type="button"
                        className="mf-chat-quote__dismiss"
                        onClick={onDismiss}
                        aria-label="Cancel reply"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
                        </svg>
                    </button>
                ) : null}
            </div>
        );
    }

    return (
        <button
            type="button"
            className="mf-chat-quote"
            onClick={onJump}
            title={`Jump to ${who}'s message`}
        >
            {inner}
        </button>
    );
}
