import EventShell from '../EventShell';

function Side({ contestant, isMine }) {
    return (
        <div className={`mf-evsd__side${isMine ? ' is-mine' : ''}`}>
            {contestant.avatar_url ? (
                <img src={contestant.avatar_url} alt="" className="mf-evsd__avatar" />
            ) : (
                <span className="mf-evsd__avatar mf-evsd__avatar--fallback">
                    {(contestant.name || '?').slice(0, 1).toUpperCase()}
                </span>
            )}
            <span className="mf-evsd__name">{contestant.name}</span>
        </div>
    );
}

/**
 * showdown — a teaser for the full head-to-head vote page: both contestants,
 * a live tally bar, total votes. Tapping the card (or its "Vote now" CTA)
 * hands off to /social/showdown/{id}, which owns the actual voting.
 */
export default function ShowdownCard({ event }) {
    const { contestant_a: a, contestant_b: b, total_votes: totalVotes = 0, my_side: mySide } = event.data || {};

    if (!a || !b) {
        return null;
    }

    return (
        <EventShell event={event} tone="pitch">
            <div className="mf-evsd">
                <div className="mf-evsd__matchup">
                    <Side contestant={a} isMine={mySide === 'a'} />
                    <span className="mf-evsd__vs">VS</span>
                    <Side contestant={b} isMine={mySide === 'b'} />
                </div>

                <div className="mf-evsd__bar">
                    <span style={{ width: `${a.percent}%` }} />
                </div>

                <p className="mf-evsd__total">
                    {totalVotes.toLocaleString()} vote{totalVotes === 1 ? '' : 's'} cast
                </p>
            </div>
        </EventShell>
    );
}
