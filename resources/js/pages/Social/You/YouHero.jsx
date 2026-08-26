import { Link } from '@inertiajs/react';
import { formatCount } from '../Profile/ProfileHero';

function StatCell({ label, value }) {
    return (
        <div className="mf-profile-stat">
            <p className="mf-mono mf-profile-stat__value">{formatCount(value)}</p>
            <p className="mf-text-caption mf-profile-stat__label">{label}</p>
        </div>
    );
}

/**
 * Identity rail for the self "You" page — avatar, name, bio, club/streak/points
 * chips, stats, and the entry point into the settings modal.
 */
export default function YouHero({ identity, loyalty, records, onEditProfile }) {
    return (
        <header className="mf-profile-hero mf-you-hero">
            <div className="mf-profile-hero__wash" aria-hidden />
            {identity.club?.logo_url ? (
                <img src={identity.club.logo_url} alt="" className="mf-profile-hero__crest" aria-hidden />
            ) : null}

            <div className="mf-profile-hero__row">
                <div className="mf-you-hero__avatar-wrap">
                    <span className="mf-you-hero__avatar-ring" aria-hidden>
                        {identity.avatar_url ? (
                            <img src={identity.avatar_url} alt="" className="mf-avatar mf-profile-hero__avatar mf-you-hero__avatar-img" />
                        ) : (
                            <div className="mf-avatar mf-profile-hero__avatar mf-text-section" aria-hidden>
                                {(identity.name || '?').slice(0, 1).toUpperCase()}
                            </div>
                        )}
                    </span>
                    <button
                        type="button"
                        className="mf-you-hero__avatar-edit"
                        onClick={onEditProfile}
                        aria-label="Edit profile photo"
                        title="Edit profile"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                        </svg>
                    </button>
                </div>

                <div className="mf-profile-hero__identity">
                    <p className="mf-text-caption mf-profile-hero__eyebrow">Your terrace</p>
                    <h1 className="mf-display mf-profile-hero__name">{identity.name}</h1>
                    <p className="mf-mono mf-text-meta mf-you-hero__handle">@{identity.handle}</p>
                    {identity.bio ? (
                        <p className="mf-text-body mf-profile-hero__bio">{identity.bio}</p>
                    ) : (
                        <p className="mf-text-meta mf-profile-hero__bio is-muted">
                            No bio yet — tell the terrace about yourself.
                        </p>
                    )}

                    <div className="mf-profile-hero__chips">
                        {identity.club?.name ? (
                            <span className="mf-profile-chip">
                                {identity.club.logo_url ? <img src={identity.club.logo_url} alt="" /> : null}
                                {identity.club.short || identity.club.name}
                            </span>
                        ) : null}
                        <span className="mf-profile-chip mf-profile-chip--accent">
                            {loyalty?.streak_days || 0}d streak
                        </span>
                        <span className="mf-profile-chip mf-profile-chip--mono">
                            {formatCount(loyalty?.points ?? 0)} pts
                        </span>
                        {loyalty?.tier?.name ? (
                            <span className="mf-profile-chip">{loyalty.tier.name}</span>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="mf-profile-stats" role="group" aria-label="Your stats">
                <StatCell label="Posts" value={records?.posts} />
                <StatCell label="Followers" value={records?.followers} />
                <StatCell label="Following" value={records?.following} />
            </div>

            <div className="mf-profile-actions">
                <button type="button" onClick={onEditProfile} className="mf-btn mf-btn--pitch">
                    Edit profile
                </button>
                <Link href={`/social/u/${identity.handle}`} className="mf-btn mf-btn--ghost">
                    Public profile
                </Link>
            </div>
        </header>
    );
}
