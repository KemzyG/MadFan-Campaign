import { useEffect, useRef } from 'react';

/**
 * Scrolling comment log. Auto-sticks to the bottom as new comments arrive,
 * same as any live chat, but stops auto-scrolling the moment the viewer has
 * manually scrolled up to read history — a burst of comments must never yank
 * them back down mid-read.
 */
export default function CommentsFeed({ comments, canModerate, onDelete, onMuteUser, onRemoveUser }) {
    const listRef = useRef(null);
    const stickyRef = useRef(true);

    useEffect(() => {
        const node = listRef.current;
        if (!node || !stickyRef.current) {
            return;
        }
        node.scrollTop = node.scrollHeight;
    }, [comments]);

    const handleScroll = () => {
        const node = listRef.current;
        if (!node) {
            return;
        }
        const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
        stickyRef.current = distanceFromBottom < 48;
    };

    return (
        <div className="kf-comments" ref={listRef} onScroll={handleScroll}>
            {comments.length === 0 ? (
                <p className="kf-comments__empty">Be the first to comment.</p>
            ) : (
                comments.map((comment) => (
                    <div
                        key={comment.id}
                        className={`kf-comments__row ${comment._optimistic ? 'is-pending' : ''}`}
                    >
                        <span className="kf-comments__author">
                            {comment.user?.handle ? `@${comment.user.handle}` : comment.user?.name || 'You'}
                        </span>
                        <span className="kf-comments__body">{comment.body}</span>
                        {canModerate && !comment._optimistic ? (
                            <span className="kf-comments__mod-actions">
                                <button
                                    type="button"
                                    className="kf-comments__mod-btn"
                                    aria-label="Mute this viewer"
                                    onClick={() => onMuteUser?.(comment.user?.id)}
                                >
                                    Mute
                                </button>
                                <button
                                    type="button"
                                    className="kf-comments__mod-btn"
                                    aria-label="Remove this viewer"
                                    onClick={() => onRemoveUser?.(comment.user?.id)}
                                >
                                    Remove
                                </button>
                                <button
                                    type="button"
                                    className="kf-comments__delete"
                                    aria-label="Delete comment"
                                    onClick={() => onDelete?.(comment.id)}
                                >
                                    ×
                                </button>
                            </span>
                        ) : null}
                    </div>
                ))
            )}
        </div>
    );
}
