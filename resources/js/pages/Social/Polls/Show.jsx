import { Head } from '@inertiajs/react';
import { useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { socialApi } from '../../../lib/socialApi';
import { useSocialFlash } from '../optimistic';

function closesLabel(closesAt) {
    if (!closesAt) {
        return null;
    }

    const diff = new Date(closesAt).getTime() - Date.now();
    if (diff <= 0) {
        return 'Closed';
    }

    const hours = Math.round(diff / (1000 * 60 * 60));
    if (hours < 1) {
        return 'Closes soon';
    }
    if (hours < 24) {
        return `Closes in ${hours}h`;
    }

    return `Closes in ${Math.round(hours / 24)}d`;
}

export default function PollShow({ poll: initialPoll }) {
    const [state, setState] = useState(initialPoll);
    const [pending, setPending] = useState(false);
    const { reportError } = useSocialFlash();
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
            .catch(() => {
                setState(previous);
                reportError('Vote failed to register — try again.');
            })
            .finally(() => setPending(false));
    }

    const closes = closesLabel(state.closes_at);

    return (
        <SocialShell title="Vote">
            <Head title={`${state.question} · Mad Fan`} />

            <div className="mf-pv-page">
                <div className="mf-pv-card">
                    <div className="mf-pv-card__eyebrow">
                        <span>Mad Fan | Fan Vote</span>
                        {!state.is_open ? <span>Closed</span> : closes ? <span>{closes}</span> : null}
                    </div>

                    <p className="mf-pv-question">{state.question}</p>

                    <div className="mf-pv-options">
                        {state.options.map((option) => {
                            const selected = state.my_option_id === option.id;

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    className={`mf-pv-option${selected ? ' is-selected' : ''}`}
                                    onClick={() => vote(option.id)}
                                    disabled={pending || !state.is_open}
                                >
                                    <span className="mf-pv-option__row">
                                        <span className="mf-pv-option__label">{option.label}</span>
                                        {hasVoted ? (
                                            <span className="mf-mono mf-pv-option__percent">{option.percent}%</span>
                                        ) : null}
                                    </span>
                                    {hasVoted ? (
                                        <span className="mf-pv-option__track">
                                            <span style={{ width: `${option.percent}%` }} />
                                        </span>
                                    ) : null}
                                    {selected ? <span className="mf-pv-option__badge">Your vote</span> : null}
                                </button>
                            );
                        })}
                    </div>

                    <p className="mf-pv-meta">
                        {state.total_votes.toLocaleString()} vote{state.total_votes === 1 ? '' : 's'}
                        {!state.is_open ? ' · Closed' : ''}
                    </p>

                    {!hasVoted && state.is_open ? (
                        <p className="mf-pv-hint">Pick an option to cast your vote — you can change your mind anytime while the poll is open.</p>
                    ) : null}
                </div>
            </div>
        </SocialShell>
    );
}
