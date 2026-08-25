import { useState } from 'react';
import PostHeader from '../post/PostHeader';
import PostText from '../post/PostText';
import MediaGrid from '../post/MediaGrid';
import EmbeddedPost from '../post/EmbeddedPost';
import PostActions from '../post/PostActions';
import ReplyComposer from '../composer/ReplyComposer';

/**
 * A single reply within the flat thread list. Replies are posts, so each one
 * can itself be replied to (inline composer) — but that reply still lands in
 * the same flat list rather than nesting under this node.
 *
 * @param {{ node: object, rootId: any, maxBodyLength?: number }} props
 */
export default function ReplyNode({ node, rootId, maxBodyLength = 280 }) {
    const [replying, setReplying] = useState(false);
    const isPending = Boolean(node._optimistic);

    return (
        <div className={`mf-comment${isPending ? ' is-optimistic' : ''}`}>
            <div className="mf-comment__body">
                <PostHeader post={node} size="sm" />

                <div className="mf-post__body">
                    <PostText text={node.body} size="ui" />
                    <MediaGrid media={node.media} />
                    <EmbeddedPost embed={node.quote_of} label="Quote" />
                    <EmbeddedPost embed={node.repost_of} />

                    <PostActions
                        post={node}
                        maxBodyLength={maxBodyLength}
                        onReply={() => setReplying((value) => !value)}
                    />
                </div>

                {replying ? (
                    <ReplyComposer
                        postId={node.id}
                        rootId={rootId}
                        maxBodyLength={maxBodyLength}
                        variant="inline"
                        autoFocus
                        placeholder={`Reply to ${node.author?.name || 'this comment'}…`}
                        onDone={() => setReplying(false)}
                    />
                ) : null}
            </div>
        </div>
    );
}
