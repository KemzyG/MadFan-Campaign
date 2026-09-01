import EventShell from '../EventShell';

const MAX_OPTIONS_SHOWN = 3;

/**
 * vote — a teaser for the full poll (question + multiple options, distinct
 * from the head-to-head fan showdown): a percent bar per option (capped so
 * a long poll doesn't take over the feed), total votes. Tapping the card
 * (or its "Answer poll" CTA) hands off to /social/polls/{id}.
 */
export default function VoteCard({ event }) {
    const { options = [], total_votes: totalVotes = 0, my_option_id: myOptionId } = event.data || {};
    const shown = options.slice(0, MAX_OPTIONS_SHOWN);
    const hidden = options.length - shown.length;

    return (
        <EventShell event={event} tone="pitch">
            <div className="mf-evvt">
                <p className="mf-evvt__question">{event.headline}</p>

                <div className="mf-evvt__options">
                    {shown.map((option) => (
                        <div
                            key={option.id}
                            className={`mf-evvt__option${myOptionId === option.id ? ' is-mine' : ''}`}
                        >
                            <span className="mf-evvt__option-row">
                                <span className="mf-evvt__option-label">{option.label}</span>
                                <span className="mf-evvt__option-percent">{option.percent}%</span>
                            </span>
                            <span className="mf-evvt__option-bar">
                                <span style={{ width: `${option.percent}%` }} />
                            </span>
                        </div>
                    ))}
                </div>

                {hidden > 0 ? <p className="mf-evvt__more">+{hidden} more option{hidden === 1 ? '' : 's'}</p> : null}

                <p className="mf-evvt__total">
                    {totalVotes.toLocaleString()} vote{totalVotes === 1 ? '' : 's'} so far
                </p>
            </div>
        </EventShell>
    );
}
