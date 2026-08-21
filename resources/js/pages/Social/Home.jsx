import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import SocialShell, { useSocialCompose } from '../../Layouts/SocialShell';
import PostCard from './components/PostCard';
import PullToRefresh from './components/PullToRefresh';
import { FeedSkeleton } from './components/Skeletons';
import { useStageSessionOptional } from './Stage/StageSessionContext';

function FeedEmpty({ mode, message, onCompose }) {
    const isFollowing = mode === 'following';

    return (
        <div className="mf-empty mf-empty--feed">
            <div className="mf-empty-mark" aria-hidden>
                <span className="mf-empty-beam" />
                <span className="mf-empty-beam mf-empty-beam--late" />
            </div>
            <p className="mf-empty-title">
                {isFollowing ? 'Empty stands' : 'Quiet floodlights'}
            </p>
            <p>{message || (isFollowing
                ? 'Follow fans to fill this terrace. Your own posts appear here too.'
                : 'Kick the first ball — the global terrace is waiting.')}</p>
            <button type="button" className="mf-btn mf-btn--pitch mt-5" onClick={onCompose}>
                Write a post
            </button>
        </div>
    );
}

function HomeFeed({ feed }) {
    const { openCompose, composeOpen } = useSocialCompose();
    const stageSession = useStageSessionOptional();
    const [dismissedIds, setDismissedIds] = useState([]);

    const posts = (feed?.posts || []).filter((post) => !dismissedIds.includes(post.id));
    const mode = feed?.mode || 'global';
    const ptrDisabled = Boolean(composeOpen || stageSession?.modalOpen || stageSession?.chatOpen);

    function dismissPost(id) {
        setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }

    const refreshFeed = useCallback(() => new Promise((resolve) => {
        router.reload({
            only: ['feed'],
            preserveScroll: true,
            preserveState: true,
            onFinish: () => resolve(),
        });
    }), []);

    return (
        <PullToRefresh onRefresh={refreshFeed} disabled={ptrDisabled}>
            <div className="mf-page mf-feed">
                <div className="mf-feed-toolbar">
                    <div className="mf-segment" role="tablist" aria-label="Feed mode">
                        <Link
                            href="/social?mode=global"
                            role="tab"
                            aria-selected={mode === 'global'}
                            className={mode === 'global' ? 'is-active' : ''}
                            preserveScroll
                            prefetch
                        >
                            Global
                        </Link>
                        <Link
                            href="/social?mode=following"
                            role="tab"
                            aria-selected={mode === 'following'}
                            className={mode === 'following' ? 'is-active' : ''}
                            preserveScroll
                            prefetch
                        >
                            Following
                        </Link>
                    </div>

                    <button
                        type="button"
                        className="mf-compose-chip"
                        onClick={openCompose}
                    >
                        Post
                    </button>
                </div>

                {posts.length === 0 ? (
                    <FeedEmpty mode={mode} message={feed?.empty_message} onCompose={openCompose} />
                ) : (
                    <div className="mf-feed-stream" role="feed" aria-label={mode === 'global' ? 'Global feed' : 'Following feed'}>
                        {posts.map((post, index) => (
                            <div
                                key={post.id}
                                className="mf-feed-item"
                                style={{ '--mf-stagger': `${Math.min(index, 8) * 28}ms` }}
                            >
                                <PostCard post={post} onDismiss={dismissPost} />
                            </div>
                        ))}
                        {feed?.links?.next ? (
                            <div className="mf-feed-more">
                                <Link
                                    href={feed.links.next}
                                    className="mf-btn mf-btn--ghost"
                                    preserveScroll
                                >
                                    Load older posts
                                </Link>
                            </div>
                        ) : (
                            <p className="mf-feed-end mf-text-caption text-[var(--mf-muted)]">
                                End of terrace · for now
                            </p>
                        )}
                    </div>
                )}

                <button
                    type="button"
                    className="mf-fab"
                    aria-label="Compose post"
                    onClick={openCompose}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeWidth="2.25" d="M12 5v14M5 12h14" />
                    </svg>
                </button>
            </div>
        </PullToRefresh>
    );
}

export default function Home({ feed }) {
    return (
        <SocialShell title="Home">
            <Head title="Home" />
            {feed == null ? <FeedSkeleton /> : <HomeFeed feed={feed} />}
        </SocialShell>
    );
}
