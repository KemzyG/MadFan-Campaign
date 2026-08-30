import CommentComposer from '../../components/CommentComposer';
import CommentsFeed from '../../components/CommentsFeed';

/**
 * The host's chat log — comment feed plus reply composer, with inline
 * moderation baked into each row (see CommentsFeed). This is the same
 * content the Studio always showed; it just lives under the "Messages" tab
 * now instead of being the only thing in the side panel.
 */
export default function MessagesPanel({ comments, allowComments, maxLength, onSubmit, onDelete, onMuteUser, onRemoveUser }) {
    return (
        <>
            <CommentsFeed
                comments={comments}
                canModerate
                onDelete={onDelete}
                onMuteUser={(userId) => userId && onMuteUser?.(userId)}
                onRemoveUser={(userId) => userId && onRemoveUser?.(userId)}
            />
            <CommentComposer
                onSubmit={onSubmit}
                disabled={!allowComments}
                maxLength={maxLength}
                placeholder="Reply as host…"
            />
        </>
    );
}
