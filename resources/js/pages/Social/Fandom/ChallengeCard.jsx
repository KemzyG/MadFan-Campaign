import { Link } from '@inertiajs/react';

/** A fan challenge from the existing campaign task board, surfaced here as an activity. */
export default function ChallengeCard({ challenge }) {
    const external = /^https?:\/\//.test(challenge.href);

    return (
        <div className="mf-fh-activity-card mf-fh-challenge-card">
            <p className="mf-fh-activity-card__kicker">🏆 Challenge · +{challenge.points} pts</p>
            <p className="mf-fh-challenge-card__name">{challenge.name}</p>
            {challenge.description ? (
                <p className="mf-fh-activity-card__meta">{challenge.description}</p>
            ) : null}

            {external ? (
                <a href={challenge.href} target="_blank" rel="noreferrer" className="mf-btn mf-btn--ghost mf-fh-challenge-card__cta">
                    Join challenge
                </a>
            ) : (
                <Link href={challenge.href} className="mf-btn mf-btn--ghost mf-fh-challenge-card__cta">
                    Join challenge
                </Link>
            )}
        </div>
    );
}
