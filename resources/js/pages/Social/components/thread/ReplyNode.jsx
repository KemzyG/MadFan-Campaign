import { useState } from 'react';
import PostHeader from '../post/PostHeader';
import PostText from '../post/PostText';
import MediaGrid from '../post/MediaGrid';
import EmbeddedPost from '../post/EmbeddedPost';
import PostActions from '../post/PostActions';
import ReplyComposer from '../composer/ReplyComposer';

function countDescendants(node) {
    if (!node.children?.length) {
        return 0;
    }
    return node.children.reduce((total, child) => total + 1 + countDescendants(child), 0);
}

/**
 * A single comment within the thread tree. Comments are posts, so each one can
 * itself be replied to (inline composer) and carries its own nested children.
 *
 * @param {{ node: object, rootId: any, maxBodyLength?: number }} props
 */
export default function ReplyNode({ node, rootId, maxBodyLength = 280 }) {
    const [replying, setReplying] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const children = node.children || [];
    const hasChildren = children.length > 0;
    const isPending = Boolean(node._optimistic);
    const descendants = hasChildren ? countDescendants(node) : 0;

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

            {hasChildren ? (
                collapsed ? (
                    <button type="button" className="mf-comment__expand" onClick={() => setCollapsed(false)}>
                        Show {descendants} {descendants === 1 ? 'reply' : 'replies'}
                    </button>
                ) : (
                    <div className="mf-comment__children">
                        <button
                            type="button"
                            className="mf-comment__rail"
                            aria-label="Collapse replies"
                            onClick={() => setCollapsed(true)}
                        />
                        <div className="mf-comment__stack">
                            {children.map((child) => (
                                <ReplyNode
                                    key={child.id}
                                    node={child}
                                    rootId={rootId}
                                    maxBodyLength={maxBodyLength}
                                />
                            ))}
                        </div>
                    </div>
                )
            ) : null}
        </div>
    );
}
