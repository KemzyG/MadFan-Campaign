import { Head, router } from '@inertiajs/react';
import SocialShell from '../../Layouts/SocialShell';
import PostCard from './components/PostCard';
import { PostCardSkeleton, ProfileSkeleton } from './components/Skeletons';
import { setAuthorFollowInProps, useSocialFlash, withRollbackFlash } from './optimistic';

export default function Profile({ profile, feed }) {
    const posts = feed?.posts || [];
    const { reportError } = useSocialFlash();

    function toggleFollow() {
        const next = !profile.is_following;
        const visit = router.optimistic((props) =>
            setAuthorFollowInProps(props, profile.id, next),
        );
        const opts = withRollbackFlash(reportError);

        if (profile.is_following) {
            visit.delete(`/social/users/${profile.id}/follow`, opts);
            return;
        }

        visit.post(`/social/users/${profile.id}/follow`, {}, opts);
    }

    return (
        <SocialShell title={profile?.name || 'Profile'} backHref="/social">
            <Head title={profile?.handle ? `@${profile.handle}` : 'Profile'} />

            {profile == null ? (
                <ProfileSkeleton />
            ) : (
                <div className="mf-page">
                    <div className="relative overflow-hidden border-b border-[var(--mf-line)] px-4 pb-6 pt-5">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 opacity-80"
                            style={{
                                background:
                                    'radial-gradient(ellipse 80% 70% at 50% -30%, rgba(255,255,255,0.08), transparent 60%), linear-gradient(180deg, rgba(20,20,20,0.65), transparent)',
                            }}
                        />

                        <div className="relative flex items-start gap-3">
                            <div className="mf-avatar mf-text-section h-14 w-14 ring-2 ring-[var(--mf-line)]">
                                {(profile.name || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="mf-display mf-text-section text-[var(--mf-text)]">{profile.name}</p>
                                <p className="mf-mono mf-text-meta text-[var(--mf-muted)]">@{profile.handle}</p>
                                {profile.bio ? (
                                    <p className="mf-text-body mt-2 text-[var(--mf-text)]">{profile.bio}</p>
                                ) : null}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {profile.club ? (
                                        <span className="mf-text-meta rounded-lg border border-[var(--mf-line)] bg-[var(--mf-panel)] px-2 py-0.5 text-[var(--mf-text)]">
                                            {profile.club.name}
                                        </span>
                                    ) : null}
                                    <span className="mf-text-meta rounded-lg border border-[var(--mf-amber)]/30 bg-[var(--mf-amber)]/10 px-2 py-0.5 font-semibold text-[var(--mf-amber)]">
                                        {profile.current_streak_days || 0}d streak
                                    </span>
                                    <span className="mf-mono mf-text-meta rounded-lg border border-[var(--mf-line)] px-2 py-0.5 text-[var(--mf-pitch)]">
                                        {profile.total_points ?? 0} pts
                                    </span>
                                </div>

                                <div className="mf-text-meta mt-3 flex flex-wrap gap-3 text-[var(--mf-muted)]">
                                    <span>
                                        <strong className="mf-mono text-[var(--mf-text)]">{profile.posts_count}</strong>{' '}
                                        posts
                                    </span>
                                    <span>
                                        <strong className="mf-mono text-[var(--mf-text)]">{profile.followers_count}</strong>{' '}
                                        followers
                                    </span>
                                    <span>
                                        <strong className="mf-mono text-[var(--mf-text)]">{profile.following_count}</strong>{' '}
                                        following
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!profile.is_self ? (
                            <button
                                type="button"
                                onClick={toggleFollow}
                                className={`relative mt-5 w-full mf-btn ${
                                    profile.is_following ? 'mf-btn--ghost' : 'mf-btn--pitch'
                                }`}
                            >
                                {profile.is_following ? 'Following' : 'Follow'}
                            </button>
                        ) : null}
                    </div>

                    <div className="border-b border-[var(--mf-line)] px-4 py-2">
                        <p className="mf-text-caption text-[var(--mf-muted)]">Posts</p>
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
                            <p>No posts yet from this fan.</p>
                        </div>
                    ) : (
                        <div>
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </SocialShell>
    );
}
