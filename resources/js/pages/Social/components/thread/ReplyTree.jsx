import { useMemo } from 'react';
import ReplyNode from './ReplyNode';

/**
 * Renders every reply to a post as one flat, chronological list — a reply to a
 * reply still lands under the same post via `reply_to_id` server-side, but the
 * thread view doesn't nest it under its parent comment; all replies sit
 * together under the root post.
 *
 * @param {{ replies: Array, rootId: any, maxBodyLength?: number }} props
 */
export default function ReplyTree({ replies, rootId, maxBodyLength = 280 }) {
    const list = Array.isArray(replies) ? replies : [];

    const sorted = useMemo(
        () =>
            [...list].sort(
                (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
            ),
        [list],
    );

    if (sorted.length === 0) {
        return null;
    }

    return (
        <div className="mf-thread">
            {sorted.map((reply) => (
                <ReplyNode key={reply.id} node={reply} rootId={rootId} maxBodyLength={maxBodyLength} />
            ))}
        </div>
    );
}
