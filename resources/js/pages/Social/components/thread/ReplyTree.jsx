import { useMemo } from 'react';
import { buildReplyTree } from './buildReplyTree';
import ReplyNode from './ReplyNode';

/**
 * Renders the full threaded reply tree for a post, built client-side from the
 * flat `replies` array.
 *
 * @param {{ replies: Array, rootId: any, maxBodyLength?: number }} props
 */
export default function ReplyTree({ replies, rootId, maxBodyLength = 280 }) {
    const tree = useMemo(() => buildReplyTree(replies, rootId), [replies, rootId]);

    if (tree.length === 0) {
        return null;
    }

    return (
        <div className="mf-thread">
            {tree.map((node) => (
                <ReplyNode key={node.id} node={node} rootId={rootId} maxBodyLength={maxBodyLength} />
            ))}
        </div>
    );
}
