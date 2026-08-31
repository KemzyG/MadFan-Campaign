import { Link } from '@inertiajs/react';

function ContestantAvatar({ contestant }) {
    return contestant.avatar_url ? (
        <img src={contestant.avatar_url} alt="" className="mf-fh-showdown-card__avatar" />
    ) : (
        <span className="mf-fh-showdown-card__avatar mf-fh-showdown-card__avatar--fallback">
            {(contestant.name || '?').slice(0, 1).toUpperCase()}
        </span>
    );
}

/** Compact teaser for the Fandom hub — full voting happens on the showdown's own page. */
export default function ShowdownCard({ showdown }) {
    const { contestant_a: a, contestant_b: b } = showdown;

    return (
        <Link href={`/social/showdown/${showdown.id}`} className="mf-fh-activity-card mf-fh-showdown-card">
            <p className="mf-fh-activity-card__kicker">⚔️ Showdown</p>
            <p className="mf-fh-showdown-card__title">{showdown.title}</p>

            <div className="mf-fh-showdown-card__matchup">
                <div className="mf-fh-showdown-card__side">
                    <ContestantAvatar contestant={a} />
                    <span className="mf-fh-showdown-card__name">{a.name}</span>
                </div>
                <span className="mf-fh-showdown-card__vs">VS</span>
                <div className="mf-fh-showdown-card__side">
                    <ContestantAvatar contestant={b} />
                    <span className="mf-fh-showdown-card__name">{b.name}</span>
                </div>
            </div>

            <div className="mf-fh-showdown-card__bar">
                <span style={{ width: `${a.percent}%` }} />
            </div>

            <p className="mf-fh-activity-card__meta">
                {showdown.total_votes.toLocaleString()} vote{showdown.total_votes === 1 ? '' : 's'}
                {showdown.my_side ? ` · You backed ${showdown.my_side === 'a' ? a.name : b.name}` : ''}
            </p>
        </Link>
    );
}
