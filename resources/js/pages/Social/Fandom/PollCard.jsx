import { useState } from 'react';
import { socialApi } from '../../../lib/socialApi';

/** Single-choice poll — vote once, see live tallies, change your mind anytime. */
export default function PollCard({ poll }) {
    const [state, setState] = useState(poll);
    const [pending, setPending] = useState(false);
    const hasVoted = state.my_option_id != null;

    function vote(optionId) {
        if (pending || !state.is_open || state.my_option_id === optionId) {
            return;
        }

        setPending(true);
        const previous = state;
        setState({ ...state, my_option_id: optionId });

        socialApi(`/polls/${state.id}/vote`, { method: 'POST', body: { option_id: optionId } })
            .then((data) => setState(data.poll))
            .catch(() => setState(previous))
            .finally(() => setPending(false));
    }

    return (
        <div className="mf-fh-activity-card mf-fh-poll-card">
            <p className="mf-fh-activity-card__kicker">📊 Poll</p>
            <p className="mf-fh-poll-card__question">{state.question}</p>

            <div className="mf-fh-poll-card__options">
                {state.options.map((option) => {
                    const selected = state.my_option_id === option.id;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            className={`mf-fh-poll-option${selected ? ' is-selected' : ''}`}
                            onClick={() => vote(option.id)}
                            disabled={pending || !state.is_open}
                        >
                            <span className="mf-fh-poll-option__row">
                                <span className="mf-fh-poll-option__label">{option.label}</span>
                                {hasVoted ? (
                                    <span className="mf-mono mf-fh-poll-option__percent">{option.percent}%</span>
                                ) : null}
                            </span>
                            {hasVoted ? (
                                <span className="mf-fh-poll-option__track">
                                    <span style={{ width: `${option.percent}%` }} />
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            <p className="mf-fh-activity-card__meta">
                {state.total_votes.toLocaleString()} vote{state.total_votes === 1 ? '' : 's'}
                {!state.is_open ? ' · Closed' : ''}
            </p>
        </div>
    );
}
