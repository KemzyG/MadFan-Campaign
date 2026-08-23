import { Link, usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { socialApi } from '../../../lib/socialApi';
import { runSocialMutation, setAuthorFollowInProps, useSocialFlash } from '../optimistic';

export function formatCount(value) {
    const n = Number(value) || 0;
    if (n >= 1_000_000) {
        return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    }
    if (n >= 10_000) {
        return `${Math.round(n / 1000)}K`;
    }
    if (n >= 1000) {
        return `${(n / 1000).toFixed(1)}K`;
    }
    return String(n);
}

function StatCell({ label, value }) {
    return (
        <div className="mf-profile-stat">
            <p className="mf-mono mf-profile-stat__value">{formatCount(value)}</p>
            <p className="mf-text-caption mf-profile-stat__label">{label}</p>
        </div>
    );
}

/**
 * Identity rail for a fan profile — avatar, name, bio, club/streak/points
 * chips, follower stats and the follow / navigation actions. Owns the optimistic
 * follow toggle for visited profiles.
 */
export default function ProfileHero({ profile, isVisit }) {
    const { reportError, reportSuccess } = useSocialFlash();
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    function toggleFollow() {
        const next = !profile.is_following;
        void runSocialMutation(
            (props) => setAuthorFollowInProps(props, profile.id, next),
            () =>
                socialApi(`/users/${profile.id}/follow`, {
                    method: profile.is_following ? 'DELETE' : 'POST',
                }),
            {
                reportError,
                reportSuccess,
                errorFallback: profile.is_following
                    ? 'Unfollow failed — rolled back.'
                    : 'Follow failed — rolled back.',
            },
        );
    }

    return (
        <header className="mf-profile-hero">
            <div className="mf-profile-hero__wash" aria-hidden />
            {profile.club?.logo_url ? (
                <img
                    src={profile.club.logo_url}
                    alt=""
                    className="mf-profile-hero__crest"
                    aria-hidden
                    onError={(event) => onImageError(event, fallbackUrl)}
                />
            ) : null}

            <div className="mf-profile-hero__row">
                <div className="mf-avatar mf-profile-hero__avatar mf-text-section" aria-hidden>
                    {(profile.name || '?').slice(0, 1).toUpperCase()}
                </div>

                <div className="mf-profile-hero__identity">
                    <p className="mf-text-caption mf-profile-hero__eyebrow">
                        {isVisit ? 'Fan profile' : 'Your terrace'}
                    </p>
                    <h1 className="mf-display mf-profile-hero__name">{profile.name}</h1>
                    {profile.bio ? (
                        <p className="mf-text-body mf-profile-hero__bio">{profile.bio}</p>
                    ) : isVisit ? (
                        <p className="mf-text-meta mf-profile-hero__bio is-muted">
                            No bio yet — still warming up.
                        </p>
                    ) : null}

                    <div className="mf-profile-hero__chips">
                        {profile.club ? (
                            <span className="mf-profile-chip">
                                {profile.club.logo_url ? (
                                    <img
                                        src={profile.club.logo_url}
                                        alt=""
                                        onError={(event) => onImageError(event, fallbackUrl)}
                                    />
                                ) : null}
                                {profile.club.short || profile.club.name}
                            </span>
                        ) : null}
                        <span className="mf-profile-chip mf-profile-chip--accent">
                            {profile.current_streak_days || 0}d streak
                        </span>
                        <span className="mf-profile-chip mf-profile-chip--mono">
                            {formatCount(profile.total_points ?? 0)} pts
                        </span>
                    </div>
                </div>
            </div>

            <div className="mf-profile-stats" role="group" aria-label="Profile stats">
                <StatCell label="Posts" value={profile.posts_count} />
                <StatCell label="Followers" value={profile.followers_count} />
                <StatCell label="Following" value={profile.following_count} />
            </div>

            {isVisit ? (
                <div className="mf-profile-actions">
                    <button
                        type="button"
                        onClick={toggleFollow}
                        className={`mf-btn ${profile.is_following ? 'mf-btn--ghost' : 'mf-btn--pitch'}`}
                    >
                        {profile.is_following ? 'Following' : 'Follow'}
                    </button>
                    <Link href="/social/chat" className="mf-btn mf-btn--ghost">
                        Club chat
                    </Link>
                </div>
            ) : (
                <div className="mf-profile-actions">
                    <Link href="/social/passport" className="mf-btn mf-btn--ghost">
                        Passport
                    </Link>
                    <Link href="/social" className="mf-btn mf-btn--pitch">
                        Open feed
                    </Link>
                </div>
            )}
        </header>
    );
}
