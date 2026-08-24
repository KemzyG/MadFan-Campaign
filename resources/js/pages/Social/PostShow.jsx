import { Head } from '@inertiajs/react';
import SocialShell from '../../Layouts/SocialShell';
import PostCard from './components/PostCard';
import ReplyComposer from './components/composer/ReplyComposer';
import ReplyTree from './components/thread/ReplyTree';
import { PostShowSkeleton } from './components/Skeletons';

export default function PostShow({ post, replies = [], max_body_length = 280 }) {
    const total = replies.length;

    return (
        <SocialShell title="Thread" backHref="/social">
            <Head title="Thread" />

            {post == null ? (
                <PostShowSkeleton />
            ) : (
                <div className="mf-page">
                    <PostCard post={post} variant="detail" maxBodyLength={max_body_length} />

                    <ReplyComposer postId={post.id} rootId={post.id} maxBodyLength={max_body_length} />

                    {total === 0 ? (
                        <div className="mf-empty mf-empty--compact">
                            <p className="mf-empty-title">Open the exchange</p>
                            <p>No replies yet — first word gets the terrace warm.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mf-thread__head">
                                <p className="mf-text-caption text-[var(--mf-muted)]">
                                    {total} {total === 1 ? 'reply' : 'replies'}
                                </p>
                            </div>
                            <ReplyTree replies={replies} rootId={post.id} maxBodyLength={max_body_length} />
                        </>
                    )}
                </div>
            )}
        </SocialShell>
    );
}
