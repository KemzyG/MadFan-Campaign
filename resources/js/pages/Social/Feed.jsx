import { Head, Link, router } from '@inertiajs/react';
import { Fragment, useCallback, useMemo, useState } from 'react';
import SocialShell, { useSocialCompose } from '../../Layouts/SocialShell';
import FriendSuggestions from './components/FriendSuggestions';
import PostCard from './components/PostCard';
import PullToRefresh from './components/PullToRefresh';
import { FeedSkeleton } from './components/Skeletons';
import UserSearch from './components/UserSearch';
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

function PostStream({ feed, suggestions }) {
    const { openCompose, composeOpen } = useSocialCompose();
    const stageSession = useStageSessionOptional();
    const [dismissedIds, setDismissedIds] = useState([]);
    const [searchOpen, setSearchOpen] = useState(false);

    const posts = (feed?.posts || []).filter((post) => !dismissedIds.includes(post.id));
    const mode = feed?.mode || 'global';
    const ptrDisabled = Boolean(composeOpen || stageSession?.modalOpen || stageSession?.chatOpen || searchOpen);

    // Stable per-load, not per-render: reshuffling on every like/optimistic
    // patch would make the strip jump around instead of just "living somewhere
    // in the terrace." Reseeded whenever the actual post set changes (new page,
    // new mode, a refresh).
    const suggestSlot = useMemo(() => {
        if (!suggestions?.length || posts.length < 2) {
            return null;
        }

        const seed = posts.reduce((total, post) => total + (Number(post.id) || 0), 0);

        return 1 + (seed % (posts.length - 1));
    }, [posts, suggestions]);

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
                            href="/social/feed?mode=global"
                            role="tab"
                            aria-selected={mode === 'global'}
                            className={mode === 'global' ? 'is-active' : ''}
                            preserveScroll
                            prefetch
                        >
                            Global
                        </Link>
                        <Link
                            href="/social/feed?mode=following"
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
                        className="mf-feed-search-btn"
                        onClick={() => setSearchOpen(true)}
                        aria-label="Search fans"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                            <circle cx="11" cy="11" r="6.5" strokeWidth="1.75" />
                            <path strokeLinecap="round" strokeWidth="1.75" d="m16 16 3.5 3.5" />
                        </svg>
                    </button>
                </div>

                {posts.length === 0 ? (
                    <FeedEmpty mode={mode} message={feed?.empty_message} onCompose={openCompose} />
                ) : (
                    <div className="mf-feed-stream" role="feed" aria-label={mode === 'global' ? 'Global feed' : 'Following feed'}>
                        {posts.map((post, index) => (
                            <Fragment key={post.id}>
                                {index === suggestSlot ? <FriendSuggestions suggestions={suggestions} /> : null}
                                <div
                                    className="mf-feed-item"
                                    style={{ '--mf-stagger': `${Math.min(index, 8) * 28}ms` }}
                                >
                                    <PostCard post={post} onDismiss={dismissPost} />
                                </div>
                            </Fragment>
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

                <UserSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
            </div>
        </PullToRefresh>
    );
}

export default function Feed({ feed, suggestions }) {
    return (
        <SocialShell title="Feed">
            <Head title="Feed" />
            {feed == null ? <FeedSkeleton /> : <PostStream feed={feed} suggestions={suggestions} />}
        </SocialShell>
    );
}
