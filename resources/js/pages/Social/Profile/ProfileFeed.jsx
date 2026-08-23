import PostCard from '../components/PostCard';
import { PostCardSkeleton } from '../components/Skeletons';

/**
 * The posts column of a profile — section label plus the fan's post stream,
 * with loading and empty states. Width-capped for comfortable reading via
 * .mf-profile-feed in social/profile.css.
 */
export default function ProfileFeed({ profile, feed, isVisit }) {
    const posts = feed?.posts || [];
    const firstName = profile.name?.split(' ')[0] || 'Fan';

    return (
        <div className="mf-profile-feed">
            <div className="mf-profile-section">
                <p className="mf-text-caption mf-profile-section__label">
                    {isVisit ? `${firstName}'s posts` : 'Your posts'}
                </p>
            </div>

            {feed == null ? (
                <div className="mf-skel-feed__stream" aria-busy="true" aria-label="Loading posts">
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                    <PostCardSkeleton compact />
                </div>
            ) : posts.length === 0 ? (
                <div className="mf-empty mf-empty--compact">
                    <p className="mf-empty-title">Silent terrace</p>
                    <p>{isVisit ? 'No posts yet from this fan.' : 'Your first post will land here.'}</p>
                </div>
            ) : (
                <div className="mf-profile-stream">
                    {posts.map((post, index) => (
                        <div
                            key={post.id}
                            className="mf-feed-item"
                            style={{ '--mf-stagger': `${Math.min(index, 6) * 24}ms` }}
                        >
                            <PostCard post={post} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
