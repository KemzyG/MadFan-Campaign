import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import SocialShell, { useSocialCompose } from '../../Layouts/SocialShell';
import PostCard from './components/PostCard';
import PullToRefresh from './components/PullToRefresh';
import { FeedSkeleton } from './components/Skeletons';
import { useStageSessionOptional } from './Stage/StageSessionContext';

function ClubStrip({ club }) {
    if (!club) {
        return null;
    }

    return (
        <div className="mf-club-strip">
            <div className="mf-club-strip__glow" aria-hidden />
            {club.logo_url ? (
                <img src={club.logo_url} alt="" className="mf-avatar h-10 w-10" />
            ) : (
                <span className="mf-avatar mf-display mf-text-meta h-10 w-10 text-[var(--mf-pitch)]">
                    {(club.short || club.name || '?').slice(0, 2).toUpperCase()}
                </span>
            )}
            <div className="min-w-0 flex-1">
                <p className="mf-text-caption text-[var(--mf-pitch)]">Club terrace</p>
                <p className="mf-display mf-text-ui truncate tracking-[0.02em] text-[var(--mf-text)]">
                    {club.name}
                </p>
                <p className="mf-text-meta truncate text-[var(--mf-muted)]">
                    {club.league || 'Club timeline'}
                </p>
            </div>
        </div>
    );
}

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
                : 'Kick the first ball — you’re already in the right end.')}</p>
            <button type="button" className="mf-btn mf-btn--pitch mt-5" onClick={onCompose}>
                Write a post
            </button>
        </div>
    );
}

function HomeFeed({ club, feed }) {
    const { openCompose, composeOpen } = useSocialCompose();
    const stageSession = useStageSessionOptional();
    const [dismissedIds, setDismissedIds] = useState([]);

    const posts = (feed?.posts || []).filter((post) => !dismissedIds.includes(post.id));
    const mode = feed?.mode || 'club';
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
                            href="/social?mode=club"
                            role="tab"
                            aria-selected={mode === 'club'}
                            className={mode === 'club' ? 'is-active' : ''}
                            preserveScroll
                            prefetch
                        >
                            Club
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

                {mode === 'club' ? <ClubStrip club={club} /> : (
                    <div className="mf-club-strip mf-club-strip--following">
                        <p className="mf-text-caption text-[var(--mf-amber)]">Following</p>
                        <p className="mf-text-meta text-[var(--mf-muted)]">
                            Fans you follow · plus your posts
                        </p>
                    </div>
                )}

                {posts.length === 0 ? (
                    <FeedEmpty mode={mode} message={feed?.empty_message} onCompose={openCompose} />
                ) : (
                    <div className="mf-feed-stream" role="feed" aria-label={mode === 'club' ? 'Club feed' : 'Following feed'}>
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

export default function Home({ club, feed }) {
    return (
        <SocialShell title="Home">
            <Head title="Home" />
            {feed == null ? <FeedSkeleton /> : <HomeFeed club={club} feed={feed} />}
        </SocialShell>
    );
}
