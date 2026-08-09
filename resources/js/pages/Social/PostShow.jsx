import { Head } from '@inertiajs/react';
import SocialShell from '../../Layouts/SocialShell';
import PostCard, { ReplyComposer } from './components/PostCard';
import { PostShowSkeleton } from './components/Skeletons';

export default function PostShow({ post, replies = [], max_body_length = 280 }) {
    return (
        <SocialShell title="Thread" backHref="/social">
            <Head title="Thread" />

            {post == null ? (
                <PostShowSkeleton />
            ) : (
                <div className="mf-page">
                    <PostCard post={post} />
                    <ReplyComposer postId={post.id} maxBodyLength={max_body_length} />

                    {replies.length === 0 ? (
                        <div className="mf-empty mf-empty--compact">
                            <p className="mf-empty-title">Open the exchange</p>
                            <p>No replies yet — first word gets the terrace warm.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="border-b border-[var(--mf-line)] px-4 py-2">
                                <p className="mf-text-caption text-[var(--mf-muted)]">
                                    Replies · {replies.length}
                                </p>
                            </div>
                            {replies.map((reply) => (
                                <PostCard key={reply.id} post={reply} compact />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </SocialShell>
    );
}
