import { Link } from '@inertiajs/react';
import PostHeader from './post/PostHeader';
import PostText from './post/PostText';
import MediaGrid from './post/MediaGrid';
import EmbeddedPost from './post/EmbeddedPost';
import PostActions from './post/PostActions';
import StagePostCard from './post/StagePostCard';
import TaggedRow from './post/TaggedRow';
import { IconRepost } from './post/icons';

/**
 * A single post as it appears in the feed (`variant="feed"`, clickable → thread)
 * or as the thread root (`variant="detail"`, full text, non-clickable).
 *
 * @param {{
 *   post: object,
 *   compact?: boolean,
 *   variant?: 'feed' | 'detail',
 *   maxBodyLength?: number,
 *   onDismiss?: (id:any) => void,
 * }} props
 */
export default function PostCard({ post, compact = false, variant = 'feed', maxBodyLength = 280, onDismiss }) {
    if (!post) {
        return null;
    }

    const isRepost = post.type === 'repost';
    const isPending = Boolean(post._optimistic);
    const isDetail = variant === 'detail';

    const textNode = (
        <PostText
            text={post.body}
            clamp={!isDetail}
            size={isDetail ? 'body' : compact ? 'ui' : 'body'}
        />
    );

    return (
        <article
            className={`mf-post${compact ? ' mf-post--compact' : ''}${isDetail ? ' mf-post--detail' : ''}${
                isPending ? ' is-optimistic' : ''
            }`}
        >
            {isRepost ? (
                <p className="mf-repost-banner">
                    <IconRepost />
                    <span>{post.author?.name} reposted</span>
                </p>
            ) : null}

            <PostHeader post={post} onDismiss={onDismiss} />

            <div className="mf-post__body">
                {post.body ? (
                    isDetail ? (
                        <div className="mf-post__content mf-post__content--detail">{textNode}</div>
                    ) : (
                        <Link href={`/social/posts/${post.id}`} className="mf-post__content">
                            {textNode}
                        </Link>
                    )
                ) : null}

                <TaggedRow tagged={post.tagged} />

                {post.stage ? <StagePostCard stage={post.stage} /> : null}

                <MediaGrid media={post.media} />
                <EmbeddedPost embed={post.quote_of} label="Quote" />
                <EmbeddedPost embed={post.repost_of} />

                <PostActions post={post} maxBodyLength={maxBodyLength} />
            </div>
        </article>
    );
}
